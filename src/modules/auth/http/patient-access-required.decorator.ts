import { SetMetadata } from '@nestjs/common';
import { PATIENT_ACCESS_REQUIRED_METADATA_KEY } from './http-auth.constants';

export function PatientAccessRequired(required: boolean) {
  return SetMetadata(PATIENT_ACCESS_REQUIRED_METADATA_KEY, required);
}
