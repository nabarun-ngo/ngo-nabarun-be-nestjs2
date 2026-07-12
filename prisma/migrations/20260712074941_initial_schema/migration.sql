-- CreateTable
CREATE TABLE "user_profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "idpSub" TEXT,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "about" TEXT,
    "picture" TEXT,
    "status" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isSameAddress" BOOLEAN,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_phone_number" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL,

    CONSTRAINT "user_phone_number_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressType" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "addressLine3" TEXT,
    "hometown" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "user_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_link" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkName" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "linkValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_social_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entity_change_log" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "oldValues" JSONB NOT NULL DEFAULT '{}',
    "newValues" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_entity_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_apikey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_apikey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role_permission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "auth_role_permission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "auth_role_group" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_role_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role_group_role" (
    "groupId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "auth_role_group_role_pkey" PRIMARY KEY ("groupId","roleId")
);

-- CreateTable
CREATE TABLE "auth_user_role" (
    "id" TEXT NOT NULL,
    "idpSub" TEXT NOT NULL,
    "ownerId" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "roleId" TEXT NOT NULL,
    "sourceGroupId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedBy" TEXT,
    "revokedBy" TEXT,
    "note" TEXT,

    CONSTRAINT "auth_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_user_role_group" (
    "id" TEXT NOT NULL,
    "idpSub" TEXT NOT NULL,
    "ownerId" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "groupId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "grantedBy" TEXT,
    "revokedBy" TEXT,
    "note" TEXT,

    CONSTRAINT "auth_user_role_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "parentId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_mention" (
    "commentId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_mention_pkey" PRIMARY KEY ("commentId","mentionedUserId")
);

-- CreateTable
CREATE TABLE "corr_notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "actionUrl" TEXT,
    "actionType" TEXT,
    "actionData" JSONB,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "dispatchId" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corr_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corr_user_notification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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

    CONSTRAINT "corr_user_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corr_resource_subscription" (
    "id" TEXT NOT NULL,
    "subscriberType" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "roleName" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "subscribedVia" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corr_resource_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corr_subscription_channel" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "emailRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corr_subscription_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_job_definition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "expression" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "inputData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_job_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definition" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "field_options_json" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "conditionJson" TEXT,
    "dependentOptionsJson" TEXT,
    "view_permissions_json" TEXT,
    "createdBy" TEXT,
    "deactivatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_value" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldDefId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_value_history_entry" (
    "id" TEXT NOT NULL,
    "customFieldValueId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldDefId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_field_value_history_entry_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "token_vault_o_auth_account" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT,
    "givenName" TEXT,
    "familyName" TEXT,
    "pictureUrl" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "token_vault_o_auth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_vault_o_auth_token" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ownerSub" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_vault_o_auth_token_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "corr_notification_type_idx" ON "corr_notification"("type");

-- CreateIndex
CREATE INDEX "corr_notification_category_idx" ON "corr_notification"("category");

-- CreateIndex
CREATE INDEX "corr_notification_createdAt_idx" ON "corr_notification"("createdAt");

-- CreateIndex
CREATE INDEX "corr_notification_ref_idx" ON "corr_notification"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "corr_notification_dispatchId_idx" ON "corr_notification"("dispatchId");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_idx" ON "corr_user_notification"("userId");

-- CreateIndex
CREATE INDEX "corr_userNotification_notificationId_idx" ON "corr_user_notification"("notificationId");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_isRead_idx" ON "corr_user_notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_isArchived_idx" ON "corr_user_notification"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "corr_userNotification_userId_createdAt_idx" ON "corr_user_notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "corr_user_notification_notificationId_userId_key" ON "corr_user_notification"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "corr_subscription_resource_active_idx" ON "corr_resource_subscription"("resourceType", "resourceId", "isActive");

-- CreateIndex
CREATE INDEX "corr_subscription_userId_active_idx" ON "corr_resource_subscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "corr_subscription_roleName_active_idx" ON "corr_resource_subscription"("roleName", "isActive");

-- CreateIndex
CREATE INDEX "corr_subscription_isActive_updatedAt_idx" ON "corr_resource_subscription"("isActive", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "corr_resource_subscription_subscriberType_userId_roleName_r_key" ON "corr_resource_subscription"("subscriberType", "userId", "roleName", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "corr_subscriptionChannel_subscriptionId_idx" ON "corr_subscription_channel"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "corr_subscription_channel_subscriptionId_channel_key" ON "corr_subscription_channel"("subscriptionId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "cron_job_definition_name_key" ON "cron_job_definition"("name");

-- CreateIndex
CREATE INDEX "custom_field_definition_entityType_active_idx" ON "custom_field_definition"("entityType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definition_entityType_key_key" ON "custom_field_definition"("entityType", "key");

-- CreateIndex
CREATE INDEX "custom_field_value_entityType_entityId_idx" ON "custom_field_value"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_value_entityType_entityId_fieldDefId_key" ON "custom_field_value"("entityType", "entityId", "fieldDefId");

-- CreateIndex
CREATE INDEX "json_store_namespace_idx" ON "json_store_document"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "json_store_document_key_namespace_key" ON "json_store_document"("key", "namespace");

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

-- AddForeignKey
ALTER TABLE "user_phone_number" ADD CONSTRAINT "user_phone_number_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_address" ADD CONSTRAINT "user_address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_link" ADD CONSTRAINT "user_social_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "corr_user_notification" ADD CONSTRAINT "corr_user_notification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "corr_notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corr_subscription_channel" ADD CONSTRAINT "corr_subscription_channel_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "corr_resource_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "custom_field_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_value_history_entry" ADD CONSTRAINT "custom_field_value_history_entry_customFieldValueId_fkey" FOREIGN KEY ("customFieldValueId") REFERENCES "custom_field_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dms_document_mapping" ADD CONSTRAINT "dms_document_mapping_documentReferenceId_fkey" FOREIGN KEY ("documentReferenceId") REFERENCES "dms_document_reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_vault_o_auth_token" ADD CONSTRAINT "token_vault_o_auth_token_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "token_vault_o_auth_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
