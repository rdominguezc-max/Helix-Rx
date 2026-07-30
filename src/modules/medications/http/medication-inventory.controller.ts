import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/http/authenticated-user.decorator';
import type {
  AuthenticatedRequestContext,
  HttpRequestWithAuth,
} from '../../auth/http/authenticated-request-context';
import { FirebaseBearerAuthGuard } from '../../auth/http/firebase-bearer-auth.guard';
import { getRequestIp, getRequestUserAgent } from '../../auth/http/http-auth.helpers';
import { PatientAccessRequired } from '../../auth/http/patient-access-required.decorator';
import { PermissionsGuard } from '../../auth/http/permissions.guard';
import { RequiredPermissions } from '../../auth/http/required-permissions.decorator';
import { AddInventoryLotUseCase } from '../application/add-inventory-lot.use-case';
import { DoseConversionService } from '../application/dose-conversion.service';
import { ListInventoryLotsUseCase } from '../application/list-inventory-lots.use-case';
import { RecordInventoryMovementUseCase } from '../application/record-inventory-movement.use-case';
import type {
  DoseConversion,
  InventoryProjection,
  MedicationInventoryLot,
  MedicationInventoryMovement,
} from '../domain/medication-inventory.entity';
import {
  type AddInventoryLotDto,
  type DoseConversionDto,
  type InventoryProjectionDto,
  type RecordInventoryMovementDto,
  parseOptionalInventoryDate,
} from './medication-inventory.dto';

@Controller()
@UseGuards(FirebaseBearerAuthGuard, PermissionsGuard)
export class MedicationInventoryController {
  constructor(
    @Inject(AddInventoryLotUseCase)
    private readonly addInventoryLotUseCase: AddInventoryLotUseCase,
    @Inject(ListInventoryLotsUseCase)
    private readonly listInventoryLotsUseCase: ListInventoryLotsUseCase,
    @Inject(RecordInventoryMovementUseCase)
    private readonly recordInventoryMovementUseCase: RecordInventoryMovementUseCase,
    @Inject(DoseConversionService)
    private readonly doseConversionService: DoseConversionService,
  ) {}

  @Post('patients/:patientId/medication-inventory')
  @RequiredPermissions('medications.write')
  async addLot(
    @Param('patientId') patientId: string,
    @Body() body: AddInventoryLotDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<MedicationInventoryLot> {
    try {
      return await this.addInventoryLotUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        actorUserId: user?.userId,
        presentationId: body.presentationId,
        lotNumber: body.lotNumber,
        quantityAcquired: body.quantityAcquired,
        acquiredAt: parseOptionalInventoryDate(body.acquiredAt, 'acquiredAt'),
        expiresOn: parseOptionalInventoryDate(body.expiresOn, 'expiresOn'),
        unitCost: body.unitCost,
        currencyCode: body.currencyCode,
        pharmacyName: body.pharmacyName,
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Get('patients/:patientId/medication-inventory')
  @RequiredPermissions('medications.read')
  listLots(
    @Param('patientId') patientId: string,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
  ): Promise<MedicationInventoryLot[]> {
    return this.listInventoryLotsUseCase.execute(
      patientId,
      this.organizationId(user),
    );
  }

  @Post('patients/:patientId/medication-inventory/:inventoryLotId/movements')
  @RequiredPermissions('medications.write')
  async recordMovement(
    @Param('patientId') patientId: string,
    @Param('inventoryLotId') inventoryLotId: string,
    @Body() body: RecordInventoryMovementDto,
    @AuthenticatedUser() user: AuthenticatedRequestContext | null,
    @Req() request: HttpRequestWithAuth,
  ): Promise<MedicationInventoryMovement> {
    try {
      return await this.recordInventoryMovementUseCase.execute({
        patientId,
        organizationId: this.organizationId(user),
        actorUserId: user?.userId,
        inventoryLotId,
        patientTreatmentId: body.patientTreatmentId,
        movementType: body.movementType,
        quantityDelta: body.quantityDelta,
        reason: body.reason,
        occurredAt: parseOptionalInventoryDate(body.occurredAt, 'occurredAt'),
        ipAddress: getRequestIp(request),
        userAgent: getRequestUserAgent(request),
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Post('medications/dose-conversion')
  @RequiredPermissions('medications.read')
  @PatientAccessRequired(false)
  convertDose(@Body() body: DoseConversionDto): DoseConversion {
    try {
      return this.doseConversionService.convert(body);
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  @Post('medications/inventory-projection')
  @RequiredPermissions('medications.read')
  @PatientAccessRequired(false)
  projectInventory(@Body() body: InventoryProjectionDto): InventoryProjection {
    try {
      return this.doseConversionService.project({
        ...body,
        from: body.from
          ? (parseOptionalInventoryDate(body.from, 'from') ?? undefined)
          : undefined,
      });
    } catch (error) {
      throw this.badRequest(error);
    }
  }

  private organizationId(user: AuthenticatedRequestContext | null): string {
    if (!user) {
      throw new InternalServerErrorException('Authenticated context missing');
    }
    if (!user.organizationId) {
      throw new ForbiddenException('Organization context required');
    }
    return user.organizationId;
  }

  private badRequest(error: unknown): BadRequestException {
    return new BadRequestException(
      error instanceof Error ? error.message : 'Invalid inventory request',
    );
  }
}
