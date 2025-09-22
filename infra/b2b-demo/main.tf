terraform {
  required_providers {
    azurerm = {
        source = "hashicorp/azurerm"
        version = "~>4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

resource "random_string" "storage_suffix" {
  length  = 16
  upper   = false
  special = false
}

resource "random_id" "function_app_suffix" {
  byte_length = 4
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "azurerm_resource_group" "rg" {
  name     = "b2b-rg"
  location = "northeurope"
}

resource "azurerm_storage_account" "b2b_storage" {
  name                     = "storage${random_string.storage_suffix.result}" // Storage account name must be globally unique
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  allow_nested_items_to_be_public = false

  tags = {
    environment = var.environment
  }
}
resource "azurerm_storage_container" "client_data" {
  name                  = var.container_name
  storage_account_id    = azurerm_storage_account.b2b_storage.id
  container_access_type = "private"
}

resource "azurerm_service_plan" "plan" {
  name                = "b2b-demo-functions-plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux" 
  sku_name            = "Y1"
}

resource "azurerm_application_insights" "ai" {
  name                = "b2b-functions-ai"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"
}

resource "azurerm_linux_function_app" "function" {
  name                       = "b2b-functions-${random_id.function_app_suffix.hex}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  service_plan_id            = azurerm_service_plan.plan.id
  storage_account_name       = azurerm_storage_account.b2b_storage.name
  storage_account_access_key = azurerm_storage_account.b2b_storage.primary_access_key

  site_config {
    application_stack {
      node_version = "20"
    }
    cors {
      allowed_origins = var.frontend_urls
    }
  }

  app_settings = {
    AZURE_STORAGE_CONNECTION_STRING   = azurerm_storage_account.b2b_storage.primary_connection_string
    BLOB_CONTAINER_NAME               = azurerm_storage_container.client_data.name
    FUNCTIONS_WORKER_RUNTIME          = "node"
    JWT_EXPIRES_IN                    = "1h"
    JWT_SECRET                        = random_password.jwt_secret.result
    NODE_ENV                          = var.environment
    APPINSIGHTS_INSTRUMENTATIONKEY    = azurerm_application_insights.ai.instrumentation_key
    SCM_DO_BUILD_DURING_DEPLOYMENT    = "true"
  }

  lifecycle {
    ignore_changes = [
      app_settings["WEBSITE_MOUNT_ENABLED"],
      app_settings["WEBSITE_RUN_FROM_PACKAGE"], // This is set automatically by Azure when the functions are deployed
      site_config[0].application_insights_key,
    ]
  }
}

output "function_app_name" {
  value = azurerm_linux_function_app.function.name
}

output "azure_storage_connection_string" {
  sensitive = true
  value     = azurerm_storage_account.b2b_storage.primary_connection_string
}