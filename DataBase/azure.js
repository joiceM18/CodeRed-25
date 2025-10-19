const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");
const mime = require("mime-types");

const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "mp3";

if (!AZURE_CONNECTION_STRING) {
    throw new Error("Azure connection string is missing.");
}

async function uploadToAzureBlobFromServer(fileBuffer, fileName, mimeType) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists({ access: "blob" });
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: {
            blobContentType: mimeType || mime.lookup(fileName) || "application/octet-stream",
        }
    });
    return `https://${blobServiceClient.accountName}.blob.core.windows.net/${CONTAINER_NAME}/${fileName}`;
}

module.exports = { uploadToAzureBlobFromServer };