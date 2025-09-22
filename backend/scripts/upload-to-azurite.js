const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");

async function uploadFiles() {
  const defaultAzuriteConnectionString =
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  "BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || defaultAzuriteConnectionString;
  const containerName = "clientdata";
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Create container if it doesn't exist
  await containerClient.createIfNotExists();
  
  // Upload files
  const files = ["Client A.xlsx", "Client B.xlsx"];
  
  for (const file of files) {
    const filePath = path.join(__dirname, "../data", file);
    if (fs.existsSync(filePath)) {
      const blockBlobClient = containerClient.getBlockBlobClient(file);
      const data = fs.readFileSync(filePath);
      await blockBlobClient.upload(data, data.length);
      console.log(`Uploaded ${file}`);
    }
  }
}

uploadFiles().catch(console.error);