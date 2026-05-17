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
        
        // POBIERANIE KURSU Z API NBP
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

        // UKRYTY SPREAD (Stałe 3% doliczane w tle)
        const fixedSpread = 0.03; 
        const effectiveUsdRate = liveUsdRate + (liveUsdRate * fixedSpread);

        // Zmienne kosztowe
        const transportUSD = 1500; 
        const commissionUSD = Math.max(priceUSD * 0.05, 300); 

        // Obliczenia w USD
        const baseForDutyUSD = priceUSD + commissionUSD + transportUSD;
        const dutyUSD = baseForDutyUSD * 0.10; 

        const baseForExciseUSD = baseForDutyUSD + dutyUSD;
        const exciseRate = (engine === 'high') ? 0.186 : 0.031;
        const exciseUSD = baseForExciseUSD * exciseRate;

        const baseForVatUSD = baseForExciseUSD + exciseUSD;
        const vatRate = (port === 'bremerhaven') ? 0.19 : 0.23;
        const vatUSD = baseForVatUSD * vatRate;

        // Przeliczenie na PLN przy użyciu RZECZYWISTEGO kursu
        const dutyPln = dutyUSD * effectiveUsdRate;
        const excisePln = exciseUSD * effectiveUsdRate;
        const vatPln = vatUSD * effectiveUsdRate;
        const totalPln = (baseForVatUSD + vatUSD) * effectiveUsdRate;

        // Aktualizacja DOM
        const formatCurrency = (amount, currency) => `${amount.toFixed(2)} ${currency}`;

        // Wyświetlamy informację, że kurs zawiera już marżę
        document.getElementById('resExchangeRate').textContent = formatCurrency(effectiveUsdRate, 'PLN (w tym 3% marży banku)');

        document.getElementById('resAuctionPrice').textContent = formatCurrency(priceUSD, 'USD');
        document.getElementById('resTransport').textContent = formatCurrency(transportUSD + commissionUSD, 'USD');
        document.getElementById('resDuty').textContent = formatCurrency(dutyPln, 'PLN');
        document.getElementById('resExcise').textContent = formatCurrency(excisePln, 'PLN');
        document.getElementById('resVat').textContent = formatCurrency(vatPln, 'PLN');
        
        document.getElementById('resTotalPln').textContent = formatCurrency(totalPln, 'PLN');
    });
});