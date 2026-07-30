import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import type {
  Medication,
  MedicationPresentation,
  PatientTreatment,
} from '../domain/medication.entity';
import type {
  CreateMedicationData,
  CreatePresentationData,
  CreateTreatmentData,
  MedicationRepository,
} from '../domain/medication.repository';

interface MedicationRow {
  id: string;
  organization_id: string | null;
  generic_name: string;
  active_ingredient: string;
  medication_form: string;
  route: string;
  status: Medication['status'];
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PresentationRow {
  id: string;
  medication_id: string;
  brand_name: string | null;
  manufacturer: string | null;
  strength_amount: string;
  strength_unit: string;
  administration_unit: string;
  package_quantity: string;
  country_code: string | null;
  status: MedicationPresentation['status'];
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface TreatmentRow {
  id: string;
  patient_id: string;
  organization_id: string;
  medication_id: string;
  prescribed_by: string | null;
  dose_amount: string;
  dose_unit: string;
  frequency_interval_hours: string | null;
  administration_times: unknown;
  instructions: string | null;
  starts_on: Date;
  ends_on: Date | null;
  is_as_needed: boolean;
  status: PatientTreatment['status'];
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function mapMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    organizationId: row.organization_id,
    genericName: row.generic_name,
    activeIngredient: row.active_ingredient,
    medicationForm: row.medication_form,
    route: row.route,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapPresentation(row: PresentationRow): MedicationPresentation {
  return {
    id: row.id,
    medicationId: row.medication_id,
    brandName: row.brand_name,
    manufacturer: row.manufacturer,
    strengthAmount: Number(row.strength_amount),
    strengthUnit: row.strength_unit,
    administrationUnit: row.administration_unit,
    packageQuantity: Number(row.package_quantity),
    countryCode: row.country_code,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapTreatment(row: TreatmentRow): PatientTreatment {
  return {
    id: row.id,
    patientId: row.patient_id,
    organizationId: row.organization_id,
    medicationId: row.medication_id,
    prescribedBy: row.prescribed_by,
    doseAmount: Number(row.dose_amount),
    doseUnit: row.dose_unit,
    frequencyIntervalHours:
      row.frequency_interval_hours === null
        ? null
        : Number(row.frequency_interval_hours),
    administrationTimes: Array.isArray(row.administration_times)
      ? row.administration_times.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
    instructions: row.instructions,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isAsNeeded: row.is_as_needed,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

@Injectable()
export class PostgresMedicationRepository implements MedicationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createMedication(data: CreateMedicationData): Promise<Medication> {
    const result = await this.databaseService.query<MedicationRow>(
      `INSERT INTO medications (
         organization_id, generic_name, active_ingredient,
         medication_form, route, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.organizationId,
        data.genericName,
        data.activeIngredient,
        data.medicationForm,
        data.route,
        data.createdBy ?? null,
      ],
    );
    return mapMedication(result.rows[0]);
  }

  async listMedications(organizationId: string): Promise<Medication[]> {
    const result = await this.databaseService.query<MedicationRow>(
      `SELECT * FROM medications
       WHERE (organization_id IS NULL OR organization_id = $1)
         AND status = 'active' AND deleted_at IS NULL
       ORDER BY generic_name, active_ingredient, id`,
      [organizationId],
    );
    return result.rows.map(mapMedication);
  }

  async findMedication(
    medicationId: string,
    organizationId: string,
  ): Promise<Medication | null> {
    const result = await this.databaseService.query<MedicationRow>(
      `SELECT * FROM medications
       WHERE id = $1
         AND (organization_id IS NULL OR organization_id = $2)
         AND status = 'active' AND deleted_at IS NULL
       LIMIT 1`,
      [medicationId, organizationId],
    );
    return result.rows[0] ? mapMedication(result.rows[0]) : null;
  }

  async createPresentation(
    data: CreatePresentationData,
  ): Promise<MedicationPresentation> {
    const result = await this.databaseService.query<PresentationRow>(
      `INSERT INTO medication_presentations (
         medication_id, brand_name, manufacturer, strength_amount,
         strength_unit, administration_unit, package_quantity,
         country_code, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.medicationId,
        data.brandName ?? null,
        data.manufacturer ?? null,
        data.strengthAmount,
        data.strengthUnit,
        data.administrationUnit,
        data.packageQuantity,
        data.countryCode ?? null,
        data.createdBy ?? null,
      ],
    );
    return mapPresentation(result.rows[0]);
  }

  async listPresentations(
    medicationId: string,
    organizationId: string,
  ): Promise<MedicationPresentation[]> {
    const result = await this.databaseService.query<PresentationRow>(
      `SELECT presentation.*
       FROM medication_presentations presentation
       JOIN medications medication ON medication.id = presentation.medication_id
       WHERE presentation.medication_id = $1
         AND (medication.organization_id IS NULL OR medication.organization_id = $2)
         AND presentation.status = 'active'
         AND presentation.deleted_at IS NULL
         AND medication.deleted_at IS NULL
       ORDER BY presentation.strength_amount, presentation.id`,
      [medicationId, organizationId],
    );
    return result.rows.map(mapPresentation);
  }

  async patientHasActiveMembership(
    patientId: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.databaseService.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM patient_organization_memberships
         WHERE patient_id = $1 AND organization_id = $2
           AND status = 'active' AND deleted_at IS NULL
       ) AS exists`,
      [patientId, organizationId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async createTreatment(data: CreateTreatmentData): Promise<PatientTreatment> {
    const result = await this.databaseService.query<TreatmentRow>(
      `INSERT INTO patient_treatments (
         patient_id, organization_id, medication_id, prescribed_by,
         dose_amount, dose_unit, frequency_interval_hours,
         administration_times, instructions, starts_on, ends_on,
         is_as_needed, created_by
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8::jsonb,
         $9, $10, $11, $12, $13
       )
       RETURNING *`,
      [
        data.patientId,
        data.organizationId,
        data.medicationId,
        data.prescribedBy ?? null,
        data.doseAmount,
        data.doseUnit,
        data.frequencyIntervalHours ?? null,
        JSON.stringify(data.administrationTimes),
        data.instructions ?? null,
        data.startsOn,
        data.endsOn ?? null,
        data.isAsNeeded,
        data.createdBy ?? null,
      ],
    );
    return mapTreatment(result.rows[0]);
  }

  async listPatientTreatments(
    patientId: string,
    organizationId: string,
  ): Promise<PatientTreatment[]> {
    const result = await this.databaseService.query<TreatmentRow>(
      `SELECT * FROM patient_treatments
       WHERE patient_id = $1 AND organization_id = $2
         AND deleted_at IS NULL
       ORDER BY starts_on DESC, created_at DESC, id`,
      [patientId, organizationId],
    );
    return result.rows.map(mapTreatment);
  }
}
