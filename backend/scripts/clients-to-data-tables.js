const { TableClient } = require("@azure/data-tables");
const readline = require("readline");

const args = process.argv.slice(2);
const auto = args.includes("--auto");

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

const defaultAzuriteConnectionString =
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  "TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;";

const exampleClients = [
  { clientId: "A", name: "Client A", code: "1234", isActive: true },
  { clientId: "B", name: "Client B", code: "5678", isActive: true },
  { clientId: "C", name: "Client C", code: "9999", isActive: false },
];

async function seedClients() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || defaultAzuriteConnectionString;

  const tableName = "clients";
  const tableClient = TableClient.fromConnectionString(connectionString, tableName, {
    allowInsecureConnection: true,
  });

  // Create table if it doesn't exist
  await tableClient.createTable().catch(() => {
    console.log("Table already exists or created successfully");
  });

  let clientsArray;

  if (auto) {
    clientsArray = exampleClients;
    console.log("Seeding default clients (--auto):", JSON.stringify(exampleClients, null, 2));
  } else {
    console.log(
      "\nPaste your clients as JSON (array of objects), or press Enter to use the example:\n" +
        JSON.stringify(exampleClients, null, 2) +
        "\n"
    );

    const input = await askQuestion("Clients JSON: ");
    if (!input) {
      clientsArray = exampleClients;
    } else {
      try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array of client objects");
        clientsArray = parsed;
      } catch (err) {
        console.error("Invalid JSON input:", err.message);
        return;
      }
    }
  }

  const clients = clientsArray.map((c) => ({
    partitionKey: "client",
    rowKey: c.code,
    clientId: c.clientId,
    name: c.name,
    code: c.code,
    isActive: c.isActive ?? true,
    createdAt: new Date(),
  }));

  // Insert or update clients
  for (const client of clients) {
    try {
      await tableClient.upsertEntity(client);
      console.log(`Seeded client: ${client.name} (Code: ${client.code})`);
    } catch (error) {
      console.error(`Failed to seed client ${client.name}:`, error.message);
    }
  }

  console.log("\nClient seeding completed!");
  console.log("Available login codes:");
  clients.forEach((client) => {
    console.log(`  - ${client.name}: ${client.code}`);
  });
}

if (require.main === module) {
  seedClients().catch(console.error);
}

module.exports = { seedClients };
