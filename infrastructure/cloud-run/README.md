# Cloud Run Prepared Baseline

This folder contains a prepared Cloud Run service manifest for a future deployment.

No real Google Cloud deployment is performed in Sprint 1.

## Build Image

```bash
docker build --target runtime -t REGION-docker.pkg.dev/PROJECT_ID/helix/helix-api:TAG .
```

## Push Image

```bash
docker push REGION-docker.pkg.dev/PROJECT_ID/helix/helix-api:TAG
```

## Deploy Prepared Manifest

```bash
gcloud run services replace infrastructure/cloud-run/service.yaml --region REGION
```

## Required Secrets

Store these in Secret Manager before deployment:

* `database-password`
* `firebase-client-email`
* `firebase-private-key`

## Notes

* Cloud SQL connectivity must be finalized before production deployment.
* The manifest uses placeholders and is not production-ready as-is.
* Migrations are not executed automatically by Cloud Run in this baseline.
