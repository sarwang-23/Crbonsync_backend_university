import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.CLIMATIQ_API_KEY;

async function testClimatiq() {
  console.log("Testing Climatiq API Search...");

  try {
    const searchRes = await fetch("https://api.climatiq.io/data/v1/search?query=electricity&region=GB&data_version=^36", {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    
    if (!searchRes.ok) {
      console.error("Search failed:", await searchRes.text());
      return;
    }

    const searchData = await searchRes.json();
    console.log(`Found ${searchData.results?.length} results for electricity in GB.`);
    
    if (searchData.results?.length > 0) {
      const firstResult = searchData.results[0];
      console.log("\nTrying Estimate endpoint with Activity ID:", firstResult.activity_id);
      
      const estimateRes = await fetch("https://api.climatiq.io/data/v1/estimate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emission_factor: {
            activity_id: firstResult.activity_id,
            region: firstResult.region,
            year: firstResult.year,
            data_version: "^36"
          },
          parameters: {
            energy: 1,
            energy_unit: "kWh"
          }
        })
      });

      if (!estimateRes.ok) {
        console.error("Estimate failed:", await estimateRes.text());
      } else {
        const estimateData = await estimateRes.json();
        console.log("\n✅ Estimate Success!");
        console.log("Factor:", estimateData.co2e, estimateData.co2e_unit);
      }
    }
  } catch (error) {
    console.error("Error connecting to Climatiq:", error);
  }
}

testClimatiq();
