import 'dotenv/config';
import { nextOrderNumber } from './src/lib/orders';

async function run() {
  console.log("🚀 Rozpoczynam test wyścigu (Race Condition Test) - 100 asynchronicznych zapytań naraz...");
  
  const promises = Array.from({ length: 100 }).map(() => nextOrderNumber("TEST"));
  
  const results = await Promise.all(promises);
  const uniqueResults = new Set(results);
  
  console.log(`Wygenerowano numerów: ${results.length}`);
  console.log(`Unikalnych numerów w bazie: ${uniqueResults.size}`);
  
  if (results.length === uniqueResults.size) {
    console.log("✅ KRYTERIUM ZALICZONE: Baza danych perfekcyjnie zablokowała wiersze. Zero duplikatów!");
  } else {
    console.log("❌ BŁĄD: Wykryto duplikaty, operacja nie była atomowa.");
  }
  process.exit(0);
}
run();
