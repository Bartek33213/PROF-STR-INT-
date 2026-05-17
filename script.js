document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');

    calculateBtn.addEventListener('click', async function() {
        
        const priceInput = document.getElementById('auctionPrice').value;
        const priceUSD = parseFloat(priceInput);
        
        if (isNaN(priceUSD) || priceUSD <= 0) {
            alert("Proszę wpisać poprawną kwotę z aukcji w USD.");
            return;
        }

        const engine = document.getElementById('engineCapacity').value;
        const port = document.getElementById('destinationPort').value;
        const usLocation = document.getElementById('usLocation').value;
        const isDamaged = document.getElementById('isDamaged').checked;
        
        // 1. POBIERANIE KURSU Z API NBP
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

        // Ukryty Spread (3%)
        const fixedSpread = 0.03; 
        const effectiveUsdRate = liveUsdRate + (liveUsdRate * fixedSpread);

        // 2. KOSZTY LOGISTYCZNE I DODATKOWE W USD
        // Transport lądowy na podstawie wybranej lokalizacji
        let landTransportUSD = 400; // Domyślnie Wschodnie Wybrzeże
        if (usLocation === 'central') landTransportUSD = 700;
        if (usLocation === 'west') landTransportUSD = 1000;

        const oceanTransportUSD = 1200; // Uśredniony koszt kontenera (fracht)
        const totalTransportUSD = landTransportUSD + oceanTransportUSD;
        
        const thcUSD = 500; // Koszty portowe (rozładunek kontenera)
        const brokerUSD = 200; // Usługa Agencji Celnej
        const commissionUSD = Math.max(priceUSD * 0.05, 300); // Prowizja domu aukcyjnego

        // 3. OPINIA RZECZOZNAWCY (OPTYMALIZACJA PODATKOWA)
        // Rzeczoznawca bierze 400 PLN, ale pozwala zbić wartość rynkową auta np. o 30% dla Urzędu Celnego
        const appraiserPLN = isDamaged ? 400 : 0;
        const acceptedCarValueUSD = isDamaged ? (priceUSD * 0.70) : priceUSD;

        // 4. OBLICZANIE PODATKÓW
        // Podstawa do cła: Zaakceptowana wartość auta + Prowizja + Transport
        const baseForDutyUSD = acceptedCarValueUSD + commissionUSD + totalTransportUSD;
        const dutyUSD = baseForDutyUSD * 0.10; 

        // Akcyza: do podstawy dorzucamy cło i często koszty rozładunku (THC)
        const baseForExciseUSD = baseForDutyUSD + dutyUSD + thcUSD;
        const exciseRate = (engine === 'high') ? 0.186 : 0.031;
        const exciseUSD = baseForExciseUSD * exciseRate;

        // VAT: do podstawy dorzuca się cło, akcyzę i koszty agencji (broker)
        const baseForVatUSD = baseForExciseUSD + exciseUSD + brokerUSD;
        const vatRate = (port === 'bremerhaven') ? 0.19 : 0.23;
        const vatUSD = baseForVatUSD * vatRate;

        // 5. PRZELICZENIE I SUMOWANIE
        const dutyPln = dutyUSD * effectiveUsdRate;
        const excisePln = exciseUSD * effectiveUsdRate;
        const vatPln = vatUSD * effectiveUsdRate;

        // Suma wszystkich fizycznych kosztów poniesionych w USD (przeliczona na PLN)
        const totalPhysicalCostsUsdToPln = (priceUSD + commissionUSD + totalTransportUSD + thcUSD + brokerUSD) * effectiveUsdRate;
        
        // Suma całkowita (Koszty w USD przeliczone na PLN + Podatki w PLN + Rzeczoznawca)
        const totalPln = totalPhysicalCostsUsdToPln + dutyPln + excisePln + vatPln + appraiserPLN;

        // 6. AKTUALIZACJA STRONY (DOM)
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