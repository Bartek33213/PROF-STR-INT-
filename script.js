document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');

    calculateBtn.addEventListener('click', async function() {
        
        // 1. POBRANIE DANYCH Z FORMULARZA
        const priceInput = document.getElementById('auctionPrice').value;
        const priceUSD = parseFloat(priceInput);
        
        if (isNaN(priceUSD) || priceUSD <= 0) {
            alert("Proszę wpisać poprawną kwotę z aukcji w USD.");
            return;
        }

        const carModelText = document.getElementById('carModel').value || "Brak nazwy pojazdu";
        const isDamaged = document.getElementById('isDamaged').checked;

        const engineSelect = document.getElementById('engineCapacity');
        const engine = engineSelect.value;
        const engineText = engineSelect.options[engineSelect.selectedIndex].text;

        const usLocationSelect = document.getElementById('usLocation');
        const usLocation = usLocationSelect.value;
        const usLocationText = usLocationSelect.options[usLocationSelect.selectedIndex].text.split(' -')[0];

        const portSelect = document.getElementById('destinationPort');
        const port = portSelect.value;
        const portText = portSelect.options[portSelect.selectedIndex].text.split(',')[0];
        
        // 2. POBIERANIE KURSU Z API NBP
        let liveUsdRate = 4.05; 
        try {
            calculateBtn.textContent = "Pobieranie kursu...";
            const response = await fetch('https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json');
            const data = await response.json();
            liveUsdRate = data.rates[0].mid; 
        } catch (error) {
            console.error("Błąd podczas pobierania kursu NBP:", error);
            alert("Nie udało się pobrać aktualnego kursu NBP. Użyto kursu awaryjnego.");
        } finally {
            calculateBtn.textContent = "Oblicz wszystkie koszty";
        }

        const fixedSpread = 0.03; 
        const effectiveUsdRate = liveUsdRate + (liveUsdRate * fixedSpread);

        // 3. KOSZTY LOGISTYCZNE I DODATKOWE
        let landTransportUSD = 400; 
        if (usLocation === 'central') landTransportUSD = 700;
        if (usLocation === 'west') landTransportUSD = 1000;

        const oceanTransportUSD = 1200; 
        const totalTransportUSD = landTransportUSD + oceanTransportUSD;
        
        const thcUSD = 500; 
        const brokerUSD = 200; 
        const commissionUSD = Math.max(priceUSD * 0.05, 300); 

        // 4. RZECZOZNAWCA I PODATKI
        const appraiserPLN = isDamaged ? 400 : 0;
        const acceptedCarValueUSD = isDamaged ? (priceUSD * 0.70) : priceUSD;

        const baseForDutyUSD = acceptedCarValueUSD + commissionUSD + totalTransportUSD;
        const dutyUSD = baseForDutyUSD * 0.10; 

        const baseForExciseUSD = baseForDutyUSD + dutyUSD + thcUSD;
        const exciseRate = (engine === 'high') ? 0.186 : 0.031;
        const exciseUSD = baseForExciseUSD * exciseRate;

        const baseForVatUSD = baseForExciseUSD + exciseUSD + brokerUSD;
        const vatRate = (port === 'bremerhaven') ? 0.19 : 0.23;
        const vatUSD = baseForVatUSD * vatRate;

        // 5. PRZELICZENIE NA PLN
        const dutyPln = dutyUSD * effectiveUsdRate;
        const excisePln = exciseUSD * effectiveUsdRate;
        const vatPln = vatUSD * effectiveUsdRate;

        const totalPhysicalCostsUsdToPln = (priceUSD + commissionUSD + totalTransportUSD + thcUSD + brokerUSD) * effectiveUsdRate;
        const totalPln = totalPhysicalCostsUsdToPln + dutyPln + excisePln + vatPln + appraiserPLN;

        // --- AKTUALIZACJA STRONY (DOM) ---
        const damageText = isDamaged ? "Uwzględniono opinię (-30% wartości celnej)" : "Auto pełnowartościowe (brak opinii)";
        
        document.getElementById('resCarModel').textContent = carModelText;
        document.getElementById('resEngine').textContent = engineText;
        document.getElementById('resRoute').textContent = `${usLocationText} ➔ ${portText}`;
        document.getElementById('resDamageStatus').textContent = damageText;
        
        document.getElementById('pdfCarDetails').style.display = 'block';

        const formatCurrency = (amount, currency) => `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

        document.getElementById('resExchangeRate').textContent = formatCurrency(effectiveUsdRate, 'PLN (w tym 3% spreadu)');
        document.getElementById('resAuctionPrice').textContent = formatCurrency(priceUSD, 'USD');
        document.getElementById('resTransportLogistics').textContent = formatCurrency(totalTransportUSD, 'USD');
        document.getElementById('resPortBroker').textContent = formatCurrency(thcUSD + brokerUSD, 'USD');
        document.getElementById('resAppraiser').textContent = formatCurrency(appraiserPLN, 'PLN');
        document.getElementById('resDuty').textContent = formatCurrency(dutyPln, 'PLN');
        document.getElementById('resExcise').textContent = formatCurrency(excisePln, 'PLN');
        document.getElementById('resVat').textContent = formatCurrency(vatPln, 'PLN');
        document.getElementById('resTotalPln').textContent = formatCurrency(totalPln, 'PLN');
    });
});