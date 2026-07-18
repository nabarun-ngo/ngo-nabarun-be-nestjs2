-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scale" VARCHAR(20) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "location" VARCHAR(255),
    "venue" VARCHAR(255),
    "assignedTo" VARCHAR(255),
    "organizerId" VARCHAR(255),
    "parentActivityId" VARCHAR(255),
    "expectedParticipants" INTEGER,
    "actualParticipants" INTEGER,
    "estimatedCost" DECIMAL(15,2),
    "actualCost" DECIMAL(15,2),
    "currency" VARCHAR(3),
    "tags" VARCHAR(50)[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entity_change_log" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(30) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "userName" VARCHAR(255) NOT NULL,
    "oldValues" JSONB NOT NULL DEFAULT '{}',
    "newValues" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(512),
    "traceId" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_entity_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_apikey" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "apiKey" VARCHAR(255) NOT NULL,
    "apiKeyId" VARCHAR(50) NOT NULL,
    "permissions" TEXT[],
    "createdBy" VARCHAR(255),
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "ownerId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_apikey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role_permission" (
    "roleId" VARCHAR(50) NOT NULL,
    "permissionId" VARCHAR(50) NOT NULL,

    CONSTRAINT "auth_role_permission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "auth_role_group" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_role_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role_group_role" (
    "groupId" VARCHAR(50) NOT NULL,
    "roleId" VARCHAR(50) NOT NULL,

    CONSTRAINT "auth_role_group_role_pkey" PRIMARY KEY ("groupId","roleId")
);

-- CreateTable
CREATE TABLE "auth_user_role" (
    "id" TEXT NOT NULL,
    "idpSub" VARCHAR(100) NOT NULL,
    "ownerId" VARCHAR(100),
    "entityId" VARCHAR(100),
    "entityType" VARCHAR(30),
    "roleId" VARCHAR(50) NOT NULL,
    "sourceGroupId" VARCHAR(50),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedBy" VARCHAR(100),
    "revokedBy" VARCHAR(100),
    "note" VARCHAR(512),

    CONSTRAINT "auth_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_user_role_group" (
    "id" TEXT NOT NULL,
    "idpSub" VARCHAR(50) NOT NULL,
    "ownerId" VARCHAR(50),
    "entityId" VARCHAR(50),
    "entityType" VARCHAR(30),
    "groupId" VARCHAR(50) NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedBy" VARCHAR(50),
    "revokedBy" VARCHAR(50),
    "note" VARCHAR(512),

    CONSTRAINT "auth_user_role_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "content" VARCHAR(512) NOT NULL,
    "authorId" VARCHAR(100) NOT NULL,
    "authorName" VARCHAR(255),
    "entityType" VARCHAR(255) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "parentId" VARCHAR(100),
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_mention" (
    "commentId" VARCHAR(100) NOT NULL,
    "mentionedUserId" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_mention_pkey" PRIMARY KEY ("commentId","mentionedUserId")
);

-- CreateTable
CREATE TABLE "correspondence_notification" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "priority" VARCHAR(255) NOT NULL,
    "actionUrl" VARCHAR(255),
    "actionType" VARCHAR(255),
    "actionData" JSONB,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(255),
    "dispatchId" VARCHAR(255),
    "imageUrl" VARCHAR(255),
    "icon" VARCHAR(255),
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondence_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_user_notification" (
    "id" TEXT NOT NULL,
    "notificationId" VARCHAR(100) NOT NULL,
    "userId" VARCHAR(100) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "isPushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "pushDelivered" BOOLEAN NOT NULL DEFAULT false,
    "pushError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondence_user_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_resource_subscription" (
    "id" TEXT NOT NULL,
    "subscriberType" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(100),
    "userEmail" VARCHAR(100),
    "userName" VARCHAR(255),
    "roleName" VARCHAR(255),
    "resourceType" VARCHAR(255) NOT NULL,
    "resourceId" VARCHAR(100),
    "subscribedVia" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondence_resource_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_subscription_channel" (
    "id" TEXT NOT NULL,
    "subscriptionId" VARCHAR(100) NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "emailRole" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondence_subscription_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_job_definition" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "expression" VARCHAR(50) NOT NULL,
    "handler" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "inputData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_job_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_form" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(255) NOT NULL DEFAULT 'draft',
    "managePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "writePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" VARCHAR(255),
    "publishedBy" VARCHAR(255),
    "disabledBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_form_field_definition" (
    "id" TEXT NOT NULL,
    "formId" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "fieldType" VARCHAR(50) NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "field_options_json" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "conditionJson" VARCHAR(255),
    "dependentOptionsJson" VARCHAR(255),
    "validationRulesJson" VARCHAR(255),
    "view_permissions_json" TEXT,
    "createdBy" VARCHAR(255),
    "disabledBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_form_field_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_form_submission" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(30) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "formId" VARCHAR(100) NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_form_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_form_field_value" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(30) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "formId" VARCHAR(100) NOT NULL,
    "formSubmissionId" VARCHAR(100) NOT NULL,
    "fieldDefId" VARCHAR(100) NOT NULL,
    "value" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_form_field_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_form_field_value_history_entry" (
    "id" TEXT NOT NULL,
    "formFieldValueId" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(30) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "formId" VARCHAR(100) NOT NULL,
    "fieldDefId" VARCHAR(100) NOT NULL,
    "oldValue" VARCHAR(255),
    "newValue" VARCHAR(255),
    "changedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_form_field_value_history_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dms_document_reference" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "remotePath" TEXT NOT NULL,
    "publicToken" TEXT,
    "contentType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT,
    "storageOwnerSub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dms_document_reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dms_document_mapping" (
    "id" TEXT NOT NULL,
    "documentReferenceId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dms_document_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_accounts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "accountHolderName" VARCHAR(255),
    "accountHolderId" VARCHAR(255),
    "activatedOn" TIMESTAMP(3),
    "bankDetail" TEXT,
    "upiDetail" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_donations" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "donorId" VARCHAR(255),
    "donorName" VARCHAR(100),
    "donorEmail" VARCHAR(100),
    "donorPhone" VARCHAR(20),
    "isGuest" BOOLEAN DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "raisedOn" TIMESTAMP(3) NOT NULL,
    "paidOn" TIMESTAMP(3),
    "confirmedById" VARCHAR(255),
    "confirmedOn" TIMESTAMP(3),
    "paymentMethod" VARCHAR(20),
    "paidToAccountId" VARCHAR(255),
    "forEventId" VARCHAR(255),
    "paidUsingUPI" VARCHAR(20),
    "isPaymentNotified" BOOLEAN DEFAULT false,
    "transactionRef" VARCHAR(255),
    "remarks" TEXT,
    "cancelletionReason" TEXT,
    "laterPaymentReason" TEXT,
    "paymentFailureDetail" TEXT,
    "additionalFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "finance_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_transactions" (
    "id" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "particulars" TEXT,
    "createdById" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "refAccountId" VARCHAR(255),
    "accountId" VARCHAR(255),

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_expenses" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "items" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "isDelegated" BOOLEAN NOT NULL DEFAULT false,
    "createdById" VARCHAR(255) NOT NULL,
    "paidById" VARCHAR(255) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "submittedById" VARCHAR(255),
    "submittedOn" TIMESTAMP(3),
    "finalizedById" VARCHAR(255),
    "finalizedOn" TIMESTAMP(3),
    "settledById" VARCHAR(255),
    "settledOn" TIMESTAMP(3),
    "rejectedById" VARCHAR(255),
    "rejectedOn" TIMESTAMP(3),
    "updatedById" VARCHAR(255),
    "updatedOn" TIMESTAMP(3),
    "accountId" VARCHAR(255),
    "accountName" VARCHAR(255),
    "transactionRef" VARCHAR(255),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "userProfileId" TEXT,

    CONSTRAINT "finance_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_earnings" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "accountId" VARCHAR(255),
    "transactionId" VARCHAR(255),
    "earningDate" TIMESTAMP(3),
    "createdById" VARCHAR(255),
    "receivedById" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "finance_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "json_store_document" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "json_store_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "extMeetingId" VARCHAR(255),
    "summary" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "location" VARCHAR(500),
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT,
    "outcomes" TEXT,
    "attendees" TEXT,
    "hostEmail" VARCHAR(255),
    "meetLink" VARCHAR(1000),
    "calendarLink" VARCHAR(1000),
    "recordingUrl" VARCHAR(1000),
    "meetingNotes" TEXT,
    "meetingTranscript" TEXT,
    "meetingActionItems" TEXT,
    "createdById" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "phase" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "budget" DECIMAL(15,2) NOT NULL,
    "spentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "location" VARCHAR(255),
    "targetBeneficiaryCount" INTEGER,
    "actualBeneficiaryCount" INTEGER,
    "managerId" VARCHAR(255) NOT NULL,
    "sponsorId" VARCHAR(255),
    "tags" VARCHAR(50)[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_beneficiaries" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "gender" VARCHAR(20),
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "contactNumber" VARCHAR(20),
    "email" VARCHAR(255),
    "address" TEXT,
    "location" VARCHAR(255),
    "category" VARCHAR(100),
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "benefitsReceived" VARCHAR(100)[],
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_goals" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "targetValue" DECIMAL(15,2),
    "targetUnit" VARCHAR(50),
    "currentValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "priority" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "weight" DECIMAL(5,4),
    "dependencies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "importance" VARCHAR(20) NOT NULL,
    "dependencies" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_team_members" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "responsibilities" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "hoursAllocated" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_risks" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(30) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "probability" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "impact" TEXT,
    "mitigationPlan" TEXT,
    "ownerId" VARCHAR(255),
    "identifiedDate" TIMESTAMP(3) NOT NULL,
    "resolvedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" VARCHAR(20) NOT NULL,
    "reportCode" VARCHAR(50) NOT NULL,
    "reportName" VARCHAR(100) NOT NULL DEFAULT '',
    "requestedById" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "parameters" JSONB,
    "needApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" VARCHAR(255),
    "approvedAt" TIMESTAMP(3),
    "approverRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewerRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "docId" VARCHAR(255),
    "docVersion" INTEGER NOT NULL DEFAULT 1,
    "workflowId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_vault_o_auth_account" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "externalId" VARCHAR(255),
    "name" VARCHAR(255),
    "givenName" VARCHAR(255),
    "familyName" VARCHAR(255),
    "pictureUrl" VARCHAR(255),
    "locale" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "token_vault_o_auth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_vault_o_auth_token" (
    "id" TEXT NOT NULL,
    "accountId" VARCHAR(100) NOT NULL,
    "clientId" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ownerSub" VARCHAR(255),
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" VARCHAR(50),
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_vault_o_auth_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "idpSub" TEXT,
    "title" VARCHAR(50),
    "firstName" VARCHAR(50) NOT NULL,
    "middleName" VARCHAR(50),
    "lastName" VARCHAR(50) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "about" TEXT,
    "picture" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isSameAddress" BOOLEAN,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_phone_number" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(100) NOT NULL,
    "phoneCode" VARCHAR(10) NOT NULL,
    "phoneNumber" VARCHAR(50) NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL,

    CONSTRAINT "user_phone_number_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_address" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(100) NOT NULL,
    "addressType" VARCHAR(20) NOT NULL,
    "addressLine1" VARCHAR(255) NOT NULL,
    "addressLine2" VARCHAR(255),
    "addressLine3" VARCHAR(255),
    "hometown" VARCHAR(100) NOT NULL,
    "zipCode" VARCHAR(10) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "district" VARCHAR(50) NOT NULL,
    "country" VARCHAR(50) NOT NULL,

    CONSTRAINT "user_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_link" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(100) NOT NULL,
    "linkName" VARCHAR(50) NOT NULL,
    "linkType" VARCHAR(50) NOT NULL,
    "linkValue" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_social_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "definitionId" VARCHAR(50) NOT NULL,
    "definitionVersion" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "currentElementId" VARCHAR(100),
    "parentInstanceId" VARCHAR(100),
    "context" JSONB NOT NULL DEFAULT '{}',
    "compensationStack" JSONB NOT NULL DEFAULT '[]',
    "initiatedById" VARCHAR(100),
    "initiatedForId" VARCHAR(100),
    "delegated" BOOLEAN NOT NULL DEFAULT false,
    "isExtUser" BOOLEAN NOT NULL DEFAULT false,
    "extUserEmail" VARCHAR(255),
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_event_log" (
    "id" TEXT NOT NULL,
    "instanceId" VARCHAR(100) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "eventType" VARCHAR(50) NOT NULL,
    "elementId" VARCHAR(100),
    "actorType" VARCHAR(20) NOT NULL,
    "actorId" VARCHAR(100),
    "payload" JSONB NOT NULL DEFAULT '{}',
    "correlationId" VARCHAR(100),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tokens" (
    "id" TEXT NOT NULL,
    "instanceId" VARCHAR(100) NOT NULL,
    "branchId" VARCHAR(100) NOT NULL,
    "parentGatewayId" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "currentElementId" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_task_inbox" (
    "id" TEXT NOT NULL,
    "instanceId" VARCHAR(100) NOT NULL,
    "elementId" VARCHAR(100) NOT NULL,
    "workflowType" VARCHAR(50) NOT NULL,
    "formKey" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL,
    "assignedToId" VARCHAR(100),
    "candidateRoleNames" JSONB NOT NULL DEFAULT '[]',
    "slaDeadlineAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "claimedById" VARCHAR(100),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_task_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_idempotency_keys" (
    "key" TEXT NOT NULL,
    "scope" VARCHAR(30) NOT NULL,
    "instanceId" VARCHAR(100),
    "result" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_idempotency_keys_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "workflow_outbox" (
    "id" TEXT NOT NULL,
    "instanceId" VARCHAR(100) NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "workflow_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_projectId_idx" ON "activities"("projectId");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_scale_idx" ON "activities"("scale");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_assignedTo_idx" ON "activities"("assignedTo");

-- CreateIndex
CREATE INDEX "activities_organizerId_idx" ON "activities"("organizerId");

-- CreateIndex
CREATE INDEX "activities_parentActivityId_idx" ON "activities"("parentActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_apikey_apiKeyId_key" ON "auth_apikey"("apiKeyId");

-- CreateIndex
CREATE INDEX "auth_apikey_ownerId_idx" ON "auth_apikey"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_key_key" ON "auth_permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "auth_role_key_key" ON "auth_role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "auth_role_group_key_key" ON "auth_role_group"("key");

-- CreateIndex
CREATE INDEX "auth_user_role_idpSub_idx" ON "auth_user_role"("idpSub");

-- CreateIndex
CREATE INDEX "auth_user_role_idpSub_ownerId_idx" ON "auth_user_role"("idpSub", "ownerId");

-- CreateIndex
CREATE INDEX "auth_user_role_idpSub_entityType_entityId_idx" ON "auth_user_role"("idpSub", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "auth_user_role_group_idpSub_idx" ON "auth_user_role_group"("idpSub");

-- CreateIndex
CREATE INDEX "auth_user_role_group_idpSub_ownerId_idx" ON "auth_user_role_group"("idpSub", "ownerId");

-- CreateIndex
CREATE INDEX "auth_user_role_group_idpSub_entityType_entityId_idx" ON "auth_user_role_group"("idpSub", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "corr_notification_type_idx" ON "correspondence_notification"("type");

-- CreateIndex
CREATE INDEX "corr_notification_category_idx" ON "correspondence_notification"("category");

-- CreateIndex
CREATE INDEX "corr_notification_createdAt_idx" ON "correspondence_notification"("createdAt");

-- CreateIndex
CREATE INDEX "corr_notification_ref_idx" ON "correspondence_notification"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "corr_notification_dispatchId_idx" ON "correspondence_notification"("dispatchId");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_idx" ON "correspondence_user_notification"("userId");

-- CreateIndex
CREATE INDEX "corr_userNotification_notificationId_idx" ON "correspondence_user_notification"("notificationId");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_isRead_idx" ON "correspondence_user_notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_isArchived_idx" ON "correspondence_user_notification"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_createdAt_idx" ON "correspondence_user_notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "correspondence_user_notification_notificationId_userId_key" ON "correspondence_user_notification"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "corr_subscription_resource_active_idx" ON "correspondence_resource_subscription"("resourceType", "resourceId", "isActive");

-- CreateIndex
CREATE INDEX "corr_subscription_userId_active_idx" ON "correspondence_resource_subscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "corr_subscription_roleName_active_idx" ON "correspondence_resource_subscription"("roleName", "isActive");

-- CreateIndex
CREATE INDEX "corr_subscription_isActive_updatedAt_idx" ON "correspondence_resource_subscription"("isActive", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "correspondence_resource_subscription_subscriberType_userId__key" ON "correspondence_resource_subscription"("subscriberType", "userId", "roleName", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "corr_subscriptionChannel_subscriptionId_idx" ON "correspondence_subscription_channel"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "correspondence_subscription_channel_subscriptionId_channel_key" ON "correspondence_subscription_channel"("subscriptionId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "cron_job_definition_name_key" ON "cron_job_definition"("name");

-- CreateIndex
CREATE INDEX "custom_form_entityType_status_idx" ON "custom_form"("entityType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "custom_form_entityType_key_key" ON "custom_form"("entityType", "key");

-- CreateIndex
CREATE INDEX "custom_form_field_definition_formId_enabled_idx" ON "custom_form_field_definition"("formId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "custom_form_field_definition_formId_key_key" ON "custom_form_field_definition"("formId", "key");

-- CreateIndex
CREATE INDEX "custom_form_submission_entityType_entityId_idx" ON "custom_form_submission"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_form_submission_entityType_entityId_formId_key" ON "custom_form_submission"("entityType", "entityId", "formId");

-- CreateIndex
CREATE INDEX "custom_form_field_value_entityType_entityId_formId_idx" ON "custom_form_field_value"("entityType", "entityId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_form_field_value_entityType_entityId_formId_fieldDef_key" ON "custom_form_field_value"("entityType", "entityId", "formId", "fieldDefId");

-- CreateIndex
CREATE INDEX "custom_form_field_value_history_entry_entityType_entityId_f_idx" ON "custom_form_field_value_history_entry"("entityType", "entityId", "formId");

-- CreateIndex
CREATE INDEX "finance_accounts_type_status_idx" ON "finance_accounts"("type", "status");

-- CreateIndex
CREATE INDEX "finance_accounts_accountHolderId_idx" ON "finance_accounts"("accountHolderId");

-- CreateIndex
CREATE INDEX "finance_donations_donorId_status_idx" ON "finance_donations"("donorId", "status");

-- CreateIndex
CREATE INDEX "finance_donations_type_status_idx" ON "finance_donations"("type", "status");

-- CreateIndex
CREATE INDEX "finance_donations_raisedOn_idx" ON "finance_donations"("raisedOn");

-- CreateIndex
CREATE INDEX "finance_transactions_accountId_createdAt_id_idx" ON "finance_transactions"("accountId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "finance_transactions_type_status_idx" ON "finance_transactions"("type", "status");

-- CreateIndex
CREATE INDEX "finance_transactions_referenceId_referenceType_idx" ON "finance_transactions"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "finance_expenses_status_idx" ON "finance_expenses"("status");

-- CreateIndex
CREATE INDEX "finance_expenses_createdById_idx" ON "finance_expenses"("createdById");

-- CreateIndex
CREATE INDEX "finance_expenses_paidById_idx" ON "finance_expenses"("paidById");

-- CreateIndex
CREATE INDEX "finance_expenses_referenceId_referenceType_idx" ON "finance_expenses"("referenceId", "referenceType");

-- CreateIndex
CREATE UNIQUE INDEX "finance_earnings_transactionId_key" ON "finance_earnings"("transactionId");

-- CreateIndex
CREATE INDEX "finance_earnings_category_status_idx" ON "finance_earnings"("category", "status");

-- CreateIndex
CREATE INDEX "finance_earnings_source_idx" ON "finance_earnings"("source");

-- CreateIndex
CREATE INDEX "json_store_namespace_idx" ON "json_store_document"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "json_store_document_key_namespace_key" ON "json_store_document"("key", "namespace");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_extMeetingId_key" ON "meetings"("extMeetingId");

-- CreateIndex
CREATE INDEX "meetings_type_status_idx" ON "meetings"("type", "status");

-- CreateIndex
CREATE INDEX "meetings_extMeetingId_idx" ON "meetings"("extMeetingId");

-- CreateIndex
CREATE INDEX "meetings_startTime_endTime_idx" ON "meetings"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "meetings_createdById_idx" ON "meetings"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_phase_idx" ON "projects"("phase");

-- CreateIndex
CREATE INDEX "projects_managerId_idx" ON "projects"("managerId");

-- CreateIndex
CREATE INDEX "projects_code_idx" ON "projects"("code");

-- CreateIndex
CREATE INDEX "project_beneficiaries_projectId_idx" ON "project_beneficiaries"("projectId");

-- CreateIndex
CREATE INDEX "project_beneficiaries_status_idx" ON "project_beneficiaries"("status");

-- CreateIndex
CREATE INDEX "project_beneficiaries_type_idx" ON "project_beneficiaries"("type");

-- CreateIndex
CREATE INDEX "project_beneficiaries_enrollmentDate_idx" ON "project_beneficiaries"("enrollmentDate");

-- CreateIndex
CREATE INDEX "project_goals_projectId_idx" ON "project_goals"("projectId");

-- CreateIndex
CREATE INDEX "project_goals_status_idx" ON "project_goals"("status");

-- CreateIndex
CREATE INDEX "project_goals_priority_idx" ON "project_goals"("priority");

-- CreateIndex
CREATE INDEX "project_milestones_projectId_idx" ON "project_milestones"("projectId");

-- CreateIndex
CREATE INDEX "project_milestones_status_idx" ON "project_milestones"("status");

-- CreateIndex
CREATE INDEX "project_milestones_targetDate_idx" ON "project_milestones"("targetDate");

-- CreateIndex
CREATE INDEX "project_team_members_projectId_idx" ON "project_team_members"("projectId");

-- CreateIndex
CREATE INDEX "project_team_members_userId_idx" ON "project_team_members"("userId");

-- CreateIndex
CREATE INDEX "project_team_members_isActive_idx" ON "project_team_members"("isActive");

-- CreateIndex
CREATE INDEX "project_risks_projectId_idx" ON "project_risks"("projectId");

-- CreateIndex
CREATE INDEX "project_risks_status_idx" ON "project_risks"("status");

-- CreateIndex
CREATE INDEX "project_risks_severity_idx" ON "project_risks"("severity");

-- CreateIndex
CREATE INDEX "project_risks_category_idx" ON "project_risks"("category");

-- CreateIndex
CREATE INDEX "reports_reportCode_idx" ON "reports"("reportCode");

-- CreateIndex
CREATE INDEX "reports_requestedById_idx" ON "reports"("requestedById");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "token_vault_o_auth_account_externalId_idx" ON "token_vault_o_auth_account"("externalId");

-- CreateIndex
CREATE INDEX "token_vault_o_auth_account_deletedAt_idx" ON "token_vault_o_auth_account"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "token_vault_o_auth_account_provider_email_key" ON "token_vault_o_auth_account"("provider", "email");

-- CreateIndex
CREATE INDEX "token_vault_o_auth_token_ownerSub_idx" ON "token_vault_o_auth_token"("ownerSub");

-- CreateIndex
CREATE INDEX "token_vault_o_auth_token_provider_email_idx" ON "token_vault_o_auth_token"("provider", "email");

-- CreateIndex
CREATE UNIQUE INDEX "token_vault_o_auth_token_accountId_clientId_key" ON "token_vault_o_auth_token"("accountId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_email_key" ON "user_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_idpSub_key" ON "user_profile"("idpSub");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_userId_isPrimary_key" ON "user_phone_number"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "user_address_userId_addressType_key" ON "user_address"("userId", "addressType");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_link_userId_linkType_key" ON "user_social_link"("userId", "linkType");

-- CreateIndex
CREATE INDEX "workflow_instances_definitionId_status_idx" ON "workflow_instances"("definitionId", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_initiatedForId_idx" ON "workflow_instances"("initiatedForId");

-- CreateIndex
CREATE INDEX "workflow_instances_parentInstanceId_idx" ON "workflow_instances"("parentInstanceId");

-- CreateIndex
CREATE INDEX "workflow_event_log_instanceId_idx" ON "workflow_event_log"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_event_log_instanceId_sequence_key" ON "workflow_event_log"("instanceId", "sequence");

-- CreateIndex
CREATE INDEX "workflow_tokens_instanceId_status_idx" ON "workflow_tokens"("instanceId", "status");

-- CreateIndex
CREATE INDEX "workflow_task_inbox_assignedToId_status_idx" ON "workflow_task_inbox"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "workflow_task_inbox_status_slaDeadlineAt_idx" ON "workflow_task_inbox"("status", "slaDeadlineAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_task_inbox_instanceId_elementId_key" ON "workflow_task_inbox"("instanceId", "elementId");

-- CreateIndex
CREATE INDEX "workflow_idempotency_keys_expiresAt_idx" ON "workflow_idempotency_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "workflow_outbox_status_createdAt_idx" ON "workflow_outbox"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_parentActivityId_fkey" FOREIGN KEY ("parentActivityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_permission" ADD CONSTRAINT "auth_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_permission" ADD CONSTRAINT "auth_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_group_role" ADD CONSTRAINT "auth_role_group_role_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "auth_role_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_group_role" ADD CONSTRAINT "auth_role_group_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_user_role" ADD CONSTRAINT "auth_user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_user_role" ADD CONSTRAINT "auth_user_role_sourceGroupId_fkey" FOREIGN KEY ("sourceGroupId") REFERENCES "auth_role_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_user_role_group" ADD CONSTRAINT "auth_user_role_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "auth_role_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mention" ADD CONSTRAINT "comment_mention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_user_notification" ADD CONSTRAINT "correspondence_user_notification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "correspondence_notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_subscription_channel" ADD CONSTRAINT "correspondence_subscription_channel_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "correspondence_resource_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_form_field_definition" ADD CONSTRAINT "custom_form_field_definition_formId_fkey" FOREIGN KEY ("formId") REFERENCES "custom_form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_form_submission" ADD CONSTRAINT "custom_form_submission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "custom_form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_form_field_value" ADD CONSTRAINT "custom_form_field_value_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "custom_form_field_definition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_form_field_value" ADD CONSTRAINT "custom_form_field_value_formSubmissionId_fkey" FOREIGN KEY ("formSubmissionId") REFERENCES "custom_form_submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_form_field_value_history_entry" ADD CONSTRAINT "custom_form_field_value_history_entry_formFieldValueId_fkey" FOREIGN KEY ("formFieldValueId") REFERENCES "custom_form_field_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dms_document_mapping" ADD CONSTRAINT "dms_document_mapping_documentReferenceId_fkey" FOREIGN KEY ("documentReferenceId") REFERENCES "dms_document_reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_accountHolderId_fkey" FOREIGN KEY ("accountHolderId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_donations" ADD CONSTRAINT "finance_donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_donations" ADD CONSTRAINT "finance_donations_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_donations" ADD CONSTRAINT "finance_donations_forEventId_fkey" FOREIGN KEY ("forEventId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_donations" ADD CONSTRAINT "finance_donations_paidToAccountId_fkey" FOREIGN KEY ("paidToAccountId") REFERENCES "finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "user_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_earnings" ADD CONSTRAINT "finance_earnings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_earnings" ADD CONSTRAINT "finance_earnings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_earnings" ADD CONSTRAINT "finance_earnings_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_beneficiaries" ADD CONSTRAINT "project_beneficiaries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_goals" ADD CONSTRAINT "project_goals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_vault_o_auth_token" ADD CONSTRAINT "token_vault_o_auth_token_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "token_vault_o_auth_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_phone_number" ADD CONSTRAINT "user_phone_number_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_address" ADD CONSTRAINT "user_address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_link" ADD CONSTRAINT "user_social_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_parentInstanceId_fkey" FOREIGN KEY ("parentInstanceId") REFERENCES "workflow_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiatedForId_fkey" FOREIGN KEY ("initiatedForId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_event_log" ADD CONSTRAINT "workflow_event_log_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tokens" ADD CONSTRAINT "workflow_tokens_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_task_inbox" ADD CONSTRAINT "workflow_task_inbox_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_outbox" ADD CONSTRAINT "workflow_outbox_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
