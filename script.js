// Czekamy, aż cały dokument HTML się załaduje
document.addEventListener('DOMContentLoaded', function() {
    
    // Pobieramy przycisk z DOM
    const calculateBtn = document.getElementById('calculateBtn');

    // Podpinamy nasłuchiwanie na kliknięcie przycisku
    calculateBtn.addEventListener('click', function() {
        
        // 1. Pobranie danych wpisanych przez użytkownika
        const priceInput = document.getElementById('auctionPrice').value;
        const priceUSD = parseFloat(priceInput);
        
        // Walidacja - sprawdzamy czy wpisano poprawną kwotę
        if (isNaN(priceUSD) || priceUSD <= 0) {
            alert("Proszę wpisać poprawną kwotę z aukcji w USD.");
            return; // Zatrzymujemy działanie funkcji
        }

        const engine = document.getElementById('engineCapacity').value;
        const port = document.getElementById('destinationPort').value;

        // 2. Deklaracja stałych kosztów i kursu walut (symulacja)
        const usdToPln = 4.05; 
        const transportUSD = 1500; // Uśredniony koszt transportu (ląd + fracht morski)
        
        // Prowizja domu aukcyjnego (np. Copart/IAAI) - zakładamy ok. 5% lub minimum 300$
        const commissionUSD = Math.max(priceUSD * 0.05, 300); 

        // 3. Obliczenia matematyczne
        // Podstawa do cła: wartość auta + prowizja + transport
        const baseForDutyUSD = priceUSD + commissionUSD + transportUSD;
        const dutyUSD = baseForDutyUSD * 0.10; // Cło wynosi zawsze 10%

        // Akcyza: zależna od pojemności silnika (np. klasyczne 5.0L V8 łapie się na wyższą stawkę)
        // Podstawa akcyzy: podstawa cła + cło
        const baseForExciseUSD = baseForDutyUSD + dutyUSD;
        const exciseRate = (engine === 'high') ? 0.186 : 0.031;
        const exciseUSD = baseForExciseUSD * exciseRate;

        // VAT: zależny od portu docelowego
        // Podstawa VAT: podstawa akcyzy + akcyza
        const baseForVatUSD = baseForExciseUSD + exciseUSD;
        const vatRate = (port === 'bremerhaven') ? 0.19 : 0.23;
        const vatUSD = baseForVatUSD * vatRate;

        // 4. Przeliczenie na złotówki (PLN)
        const dutyPln = dutyUSD * usdToPln;
        const excisePln = exciseUSD * usdToPln;
        const vatPln = vatUSD * usdToPln;
        const totalPln = (baseForVatUSD + vatUSD) * usdToPln;

        // 5. Dynamiczna aktualizacja strony (DOM manipulation)
        // Funkcja pomocnicza do formatowania waluty z dwiema miejscami po przecinku
        const formatCurrency = (amount, currency) => `${amount.toFixed(2)} ${currency}`;

        document.getElementById('resAuctionPrice').textContent = formatCurrency(priceUSD, 'USD');
        document.getElementById('resTransport').textContent = formatCurrency(transportUSD + commissionUSD, 'USD (w tym prowizja)');
        document.getElementById('resDuty').textContent = formatCurrency(dutyPln, 'PLN');
        document.getElementById('resExcise').textContent = formatCurrency(excisePln, 'PLN');
        document.getElementById('resVat').textContent = formatCurrency(vatPln, 'PLN');
        
        document.getElementById('resTotalPln').textContent = formatCurrency(totalPln, 'PLN');
    });
});