document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('siteId');
    const query = urlParams.get('query');
    const currentUrl = urlParams.get('currentUrl');
    const compareButton = document.getElementById('compareButton');
    const couponButton = document.getElementById('couponButton');
    const content = document.getElementById('content');
    const searchInput = document.getElementById('searchInput');

    if (query) {
        document.getElementById('page-title').innerText = query;
        document.getElementById('header-title').innerText = query;
    }

    // Fetch sites data first for both normal and currentUrl modes
    fetch('https://o0rmue7xt0.execute-api.il-central-1.amazonaws.com/dev/sites')
        .then((response) => response.json())
        .then((sitesData) => {
            // If we have currentUrl parameter, handle that mode
            if (currentUrl) {
                handleCurrentUrlMode(currentUrl, sitesData);
            } else {
                // Normal mode - handle regular site selection buttons
                generateButtons(sitesData);

                // Continue with API request if siteId and query are provided
                if (siteId && query) {
                    const apiUrl = `https://o0rmue7xt0.execute-api.il-central-1.amazonaws.com/dev/items?siteId=${siteId}&query=${query}`;

                    fetch(apiUrl)
                        .then(response => response.json())
                        .then(data => {
                            let formattedData = [];
                            if (isOldFormat(data)) {
                                formattedData = formatOldData(data);
                            } else {
                                formattedData = formatNewData(data);
                            }
                            window.allData = formattedData; // Store all data globally
                            const uniqueData = getUniqueData(formattedData);
                            populateTable(uniqueData);
                            addSortAndFilter(uniqueData);
                        })
                        .catch(error => console.error('Error fetching data:', error));
                }
            }
        })
        .catch((error) => {
            console.error('Error fetching sites data:', error);
        });

function handleCurrentUrlMode(url, sitesData) {
    // Clear existing content
    if (content) {
        content.innerHTML = '';
    }

    // Hide the top buttons in currentUrl mode
    if (compareButton) compareButton.style.display = 'none';
    if (couponButton) couponButton.style.display = 'none';
    if (searchInput) searchInput.style.display = 'none';

    // Extract baseUrl from the current URL
    const baseUrl = extractBaseUrl(url);

    // Create container for site information
    const siteInfoContainer = document.createElement('div');
    siteInfoContainer.className = 'site-info-container';

    // Create header with logo and title
    const header = document.createElement('div');
    header.className = 'site-info-header';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'site-info-header-content';
    
    const logo = document.createElement('img');
    logo.src = 'https://lh3.googleusercontent.com/Sp3b24fVCvCVewv5udOP_e-qNVWGuxcZX9DEgYmKncXjeO9kp6KKCJ8NFcVs0VQNFeWo1P9p8-aYV1fDyq1Ct0ZCXec=s60';
    logo.alt = 'שם זה זול יותר';
    headerContent.appendChild(logo);

    const headerTitle = document.createElement('h1');
    headerTitle.textContent = 'שם זה זול יותר';
    headerContent.appendChild(headerTitle);
    
    header.appendChild(headerContent);
    siteInfoContainer.appendChild(header);

    // Create content section
    const siteContent = document.createElement('div');
    siteContent.className = 'site-content';

    // Find if the site exists in our database
    const siteInfo = findSiteByUrl(baseUrl, sitesData);

    // Create site name/title element
    const siteTitle = document.createElement('h2');
    siteTitle.className = 'site-title';

    if (siteInfo) {
        // Site exists in our database
        siteTitle.textContent = siteInfo.siteName;
        siteContent.appendChild(siteTitle);

        // Add supported features section
        const featuresSection = document.createElement('div');
        featuresSection.className = 'features-section';

        const featuresLabel = document.createElement('p');
        featuresLabel.className = 'features-label';
        featuresLabel.textContent = 'תכונות נתמכות:';
        featuresSection.appendChild(featuresLabel);

        const featuresContent = document.createElement('p');
        featuresContent.className = 'features-content';
        featuresContent.textContent = getSupportedFeatures(siteInfo);
        featuresSection.appendChild(featuresContent);

        siteContent.appendChild(featuresSection);

        // Create coupon section
        const couponSection = document.createElement('div');
        couponSection.className = 'coupon-section';

        // Check if coupon is available
        let hasCoupon = false;
        if (siteInfo.cupon && siteInfo.cupon.trim() !== '') {
            hasCoupon = true;

            const couponTitle = document.createElement('h3');
            couponTitle.textContent = '🎟️ קופון זמין';
            couponSection.appendChild(couponTitle);

            // Create coupon container
            const couponContainer = document.createElement('div');
            couponContainer.className = 'coupon-container';

            // Create coupon code element
            const couponCode = document.createElement('div');
            couponCode.className = 'coupon-code';
            couponCode.textContent = siteInfo.cupon;
            couponCode.onclick = function () {
                navigator.clipboard.writeText(siteInfo.cupon)
                    .then(() => {
                        // Show copy notification
                        couponCode.setAttribute('data-copied', 'true');
                        setTimeout(() => {
                            couponCode.removeAttribute('data-copied');
                        }, 2000);
                    });
            };
            couponCode.title = 'לחץ להעתקה';
            couponContainer.appendChild(couponCode);

            // If coupon details available, show them
            if (siteInfo.cuponDetails) {
                const couponDetails = document.createElement('div');
                couponDetails.className = 'coupon-details';
                couponDetails.textContent = siteInfo.cuponDetails;
                couponContainer.appendChild(couponDetails);
            }

            couponSection.appendChild(couponContainer);
        } else {
            // No coupon available
            const couponTitle = document.createElement('h3');
            couponTitle.textContent = 'קופון';
            couponSection.appendChild(couponTitle);

            const noCouponMsg = document.createElement('div');
            noCouponMsg.className = 'no-coupon-message';
            noCouponMsg.textContent = 'אין קופון זמין';
            couponSection.appendChild(noCouponMsg);
        }

        siteContent.appendChild(couponSection);
    } else {
        // Site does not exist in our database
        siteContent.className = 'site-content unsupported-site-content';
        
        siteTitle.textContent = 'לא נתמך עדיין באתר זה';
        siteTitle.style.fontSize = '16px';
        siteContent.appendChild(siteTitle);

        // Display current site URL
        const siteUrlElement = document.createElement('p');
        siteUrlElement.textContent = baseUrl;
        siteUrlElement.className = 'site-url';
        siteContent.appendChild(siteUrlElement);

        // Create button to show available sites
        const showSitesButton = document.createElement('a');
        showSitesButton.className = 'button';
        showSitesButton.textContent = 'הצג אתרים זמינים';
        showSitesButton.href = window.location.pathname;
        siteContent.appendChild(showSitesButton);

        // Create button for request to add site
        const addSiteButton = document.createElement('a');
        addSiteButton.href = `https://mail.google.com/mail/?view=cm&fs=1&to=shamzezolyoter@gmail.com&su=בקשה להוספת אתר&body=היי, אני רוצה לבקש הוספת האתר ${baseUrl} למערכת שם זה זול יותר.`;
        addSiteButton.className = 'button';
        addSiteButton.textContent = 'בקשה להוספת אתר';
        addSiteButton.target = '_blank';
        siteContent.appendChild(addSiteButton);
    }

    siteInfoContainer.appendChild(siteContent);
    content.appendChild(siteInfoContainer);
}

    function getSupportedFeatures(siteInfo) {
        if (!siteInfo || !siteInfo.compareWith) return ''; // No data available

        const features = [];

        // Check for different types of support based on compareWith properties
        if (siteInfo.compareWith.fetchProvider === "ksp") {
            features.push('השוואת מחירים');
        }

        if (siteInfo.compareWith.format === "supers") {
            features.push('השוואת מחירים בין סופרים');
        }

        // Check for different types
        switch (siteInfo.compareWith.type) {
            case "json":
                features.push('השוואת מחירים');
                break;
            case "generalSearch":
                features.push('השוואת מחירים');
                break;
            case "modalIframe":
                features.push('השוואת מחירים');
                break;
            case "STOPgeneralSearch":
                features.push('השוואת מחירים - לא זמין עקב תקלה זמנית');
                break;
            case "KuponAndCompere":
                features.push('השוואת מחירים וקופונים');
                break;
            case "generalSearchIncode":
                features.push('השוואת מחירים');
                break;
            case "combinedPriceComparisonCoupon":
                features.push('השוואת מחירים וקופונים');
                break;
            case "CouponContentJson":
                features.push('קופונים');
                break;
            case "modalFlightComparison":
                features.push('השוואת מחירי טיסות');
                break;
        }

        // Check for kupon property
        if (siteInfo.compareWith.kupon === 'cupons' || siteInfo.cupon !== "") {
            features.push('איתור קופון');
        }

        // If no features found
        if (features.length === 0) {
            return 'לא זוהו תכונות נתמכות';
        }

        return features.join(' • ');
    }

    function extractBaseUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            // If not a valid URL, return as is
            return url;
        }
    }

    function findSiteByUrl(baseUrl, sitesData) {
        return sitesData.find(site => {
            try {
                const siteHostname = new URL(site.URL).hostname;
                return siteHostname === baseUrl || site.URL.includes(baseUrl);
            } catch (e) {
                return false;
            }
        });
    }

    function generateButtons(data) {
        if (content) {
            content.innerHTML = ''; // Clear existing buttons
            const compereData = data.filter((item) => item.compareWith.kupon !== 'cupons');
            const kuponData = data.filter((item) => item.compareWith.kupon === 'cupons');

            if (compareButton) {
                compareButton.addEventListener('click', () => {
                    compareButton.classList.add('selected');
                    if (couponButton) couponButton.classList.remove('selected');
                    displayData(compereData);
                });
            }

            if (couponButton) {
                couponButton.addEventListener('click', () => {
                    couponButton.classList.add('selected');
                    if (compareButton) compareButton.classList.remove('selected');
                    displayData(kuponData);
                });
            }

            // Initialize with the default data (השוואה list) when the page loads
            displayData(compereData);

            // Listen for changes in the search input field
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const searchText = searchInput.value.toLowerCase().trim();
                    const filteredData = data.filter(item =>
                        item.siteName.toLowerCase().includes(searchText) ||
                        item.URL.toLowerCase().includes(searchText)
                    );
                    displayData(filteredData);
                });
            }
        }
    }

    function displayData(data) {
        if (content) {
            content.innerHTML = ''; // Clear existing buttons
            data.forEach((item) => {
                // Check if the URL is not an empty string
                if (item.URL) {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'button-container';

                    const buttonLink = document.createElement('a');
                    buttonLink.href = item.affLink;
                    buttonLink.target = '_blank'; // Open in a new tab
                    buttonLink.className = 'button-link';

                    const button = document.createElement('button');
                    button.textContent = item.siteName || item.site;
                    button.className = 'button';

                    buttonLink.appendChild(button);
                    buttonContainer.appendChild(buttonLink);
                    content.appendChild(buttonContainer);
                }
            });
        }
    }

    function isOldFormat(data) {
        return data[0] && data[0].hasOwnProperty('ItemCode');
    }

    function formatOldData(data) {
        return data.map(item => ({
            id: item.ItemCode,
            createdAt: item.PriceUpdateDate,
            name: cleanName(item.ItemName || item.ManufacturerItemDescription),
            priceILS: parseFloat(item.ItemPrice),
            url: item.URL,
            website: item.Super
        }));
    }

    function formatNewData(data) {
        return data.map(item => ({
            id: item.id,
            createdAt: item.createdAt,
            name: cleanName(item.name),
            priceILS: parseFloat(item.priceILS),
            url: item.url,
            website: item.website
        }));
    }

    function getUniqueData(data) {
        const uniqueItems = [];
        const itemMap = new Map();

        data.forEach(item => {
            const key = `${item.name}-${item.website}`;
            if (!itemMap.has(key)) {
                itemMap.set(key, []);
            }
            itemMap.get(key).push(item);
        });

        itemMap.forEach(items => {
            uniqueItems.push(items[0]);
        });

        return uniqueItems;
    }

    function createItemMap(data) {
        const itemMap = new Map();

        data.forEach(item => {
            const key = `${item.name}-${item.website}`;
            if (!itemMap.has(key)) {
                itemMap.set(key, []);
            }
            itemMap.get(key).push(item);
        });

        return itemMap;
    }

    function populateTable(data) {
        const tbody = document.querySelector('#data-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            const itemMap = createItemMap(getAllData());

            data.forEach(item => {
                const row = document.createElement('tr');
                const key = `${item.name}-${item.website}`;
                const itemHistory = itemMap.get(key);
                const itemCount = itemHistory.length;
                const buttonDisabled = itemCount <= 1 ? 'disabled' : '';

                itemHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                const mostRecentItem = itemHistory[0];
                const insight = getInsight(itemHistory);
                const domainName = extractDomain(mostRecentItem.url);

                row.innerHTML = `
                    <td>${mostRecentItem.name}</td>
                    <td>${mostRecentItem.priceILS}</td>
                    <td><a href="${mostRecentItem.url}" target="_blank" title="${mostRecentItem.url}">Link</a></td>
                    <td title="${mostRecentItem.url}">${domainName}</td>
                    <td>${new Date(mostRecentItem.createdAt).toLocaleString()}</td>
                    <td><button class="price-history-btn" data-name="${mostRecentItem.name}" data-website="${domainName}" ${buttonDisabled}>הסטוריית מחירים</button></td>
                    <td>${insight}</td>
                `;
                tbody.appendChild(row);
            });

            document.querySelectorAll('.price-history-btn').forEach(button => {
                button.addEventListener('click', event => {
                    const name = event.target.dataset.name;
                    const website = event.target.dataset.website;
                    if (!event.target.disabled) {
                        displayPriceHistory(name, website);
                    }
                });
            });
        }
    }

    function extractDomain(url) {
        let domain;
        try {
            domain = new URL(url).hostname;
        } catch (e) {
            domain = url;
        }
        return domain.replace(/^www\./, '');
    }

    function getInsight(itemHistory) {
        if (itemHistory.length < 2) return '';

        // Sort by date, most recent first
        itemHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const currentPrice = parseFloat(itemHistory[0].priceILS);
        const previousPrice = parseFloat(itemHistory[1].priceILS);

        if (isNaN(currentPrice) || isNaN(previousPrice)) return '';

        const priceDifference = currentPrice - previousPrice;
        const percentageChange = (priceDifference / previousPrice) * 100;

        if (percentageChange <= -20) {
            return 'ירידת מחיר חדה';
        } else if (percentageChange >= 20) {
            return 'עליית מחיר חדה';
        } else if (percentageChange < 0) {
            return 'ירידת מחיר';
        } else if (percentageChange > 0) {
            return 'עליית מחיר';
        } else {
            return '';
        }
    }

    function createPriceHistoryGraph(data) {
        const ctx = document.getElementById('priceHistoryChart').getContext('2d');

        if (window.priceHistoryChart instanceof Chart) {
            window.priceHistoryChart.destroy();
        }

        const chartData = data.map(item => ({
            x: new Date(item.createdAt),
            y: parseFloat(item.priceILS)
        })).reverse();

        window.priceHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Price History',
                    data: chartData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                aspectRatio: 2, // This should match the aspect-ratio in CSS
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price (ILS)'
                        },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: false // Hide the legend if not needed
                    }
                }
            }
        });
    }

    function addSortAndFilter(data) {
        const headers = document.querySelectorAll('#data-table th');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                const order = header.dataset.order === 'desc' ? 'asc' : 'desc';
                header.dataset.order = order;
                const sortedData = sortData(data, column, order);
                populateTable(sortedData);
            });
        });

        const filterInput = document.getElementById('filterKey');
        if (filterInput) {
            filterInput.addEventListener('input', () => {
                const filteredData = filterData(data, filterInput.value);
                populateTable(filteredData);
            });
        }

        const priceFromInput = document.getElementById('priceFrom');
        const priceToInput = document.getElementById('priceTo');
        const filterWebsiteInput = document.getElementById('filterWebsite');

        if (priceFromInput) {
            priceFromInput.addEventListener('input', () => {
                const filteredData = filterDataByPrice(data, priceFromInput.value, priceToInput.value, filterWebsiteInput.value);
                populateTable(filteredData);
            });
        }

        if (priceToInput) {
            priceToInput.addEventListener('input', () => {
                const filteredData = filterDataByPrice(data, priceFromInput.value, priceToInput.value, filterWebsiteInput.value);
                populateTable(filteredData);
            });
        }

        if (filterWebsiteInput) {
            filterWebsiteInput.addEventListener('input', () => {
                const filteredData = filterDataByPrice(data, priceFromInput.value, priceToInput.value, filterWebsiteInput.value);
                populateTable(filteredData);
            });
        }
    }

    function sortData(data, key, order) {
        return [...data].sort((a, b) => {
            if (key === 'priceILS') {
                return order === 'asc' ? parseFloat(a[key]) - parseFloat(b[key]) : parseFloat(b[key]) - parseFloat(a[key]);
            } else if (key === 'name' || key === 'url' || key === 'website') {
                return order === 'asc' ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
            } else if (key === 'createdAt') {
                return order === 'asc' ? new Date(a[key]) - new Date(b[key]) : new Date(b[key]) - new Date(a[key]);
            }
        });
    }

    function filterData(data, keyword) {
        return data.filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()));
    }

    function filterDataByPrice(data, fromPrice, toPrice, website) {
        return data.filter(item => {
            const price = parseFloat(item.priceILS);
            const matchesWebsite = !website || item.website.toLowerCase().includes(website.toLowerCase());
            const matchesPriceFrom = !fromPrice || price >= parseFloat(fromPrice);
            const matchesPriceTo = !toPrice || price <= parseFloat(toPrice);
            return matchesWebsite && matchesPriceFrom && matchesPriceTo;
        });
    }

    function displayPriceHistory(name, website) {
        const allData = getAllData();
        const historyData = allData.filter(item => item.name === name && item.website === website);
        const sortedHistoryData = sortData(historyData, 'createdAt', 'desc');
        const tbody = document.querySelector('#history-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            sortedHistoryData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.priceILS}</td>
                    <td><a href="${item.url}" target="_blank" rel="noopener noreferrer">Link</a></td>
                    <td>${item.website}</td>
                    <td>${new Date(item.createdAt).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
        }
        const modal = document.getElementById('priceHistoryModal');
        if (modal) {
            modal.style.display = 'block';
        }

        // Add graph
        createPriceHistoryGraph(sortedHistoryData);
    }

    function getAllData() {
        return window.allData || [];
    }

    function cleanName(name) {
        return name.replace(/"/g, "'");
    }

    document.querySelector('.close').addEventListener('click', () => {
        const modal = document.getElementById('priceHistoryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    });

    window.onclick = event => {
        const modal = document.getElementById('priceHistoryModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
