jQuery(document).ready(function($) {
    var map = L.map('map', {
        center: [43.604652, 1.444209], // Coordonnées de Toulouse
        zoom: 12, // Un niveau de zoom adapté pour voir la ville
        maxZoom: 18,
        minZoom: 8
    });
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
    }).addTo(map);
    
    var markersCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        iconCreateFunction: function(cluster) {
            return L.divIcon({
                html: '<div style="background-color: #ff2e39;color: white; padding: 10px; text-align: center; border-radius: 100%; box-shadow: 0 0 15px #e5c732; font-weight: bold;"><span>' + cluster.getChildCount() + '</span></div>',
                className: 'mycluster',
                iconSize: L.point(40, 40)
            });
        }
    });
    
    let allMarkers = []; 

    var customIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/128/9131/9131546.png', // Chemin vers votre image
        iconSize: [35, 35], // Taille de l'icône [largeur, hauteur]
        iconAnchor: [16, 32], // Point d'ancrage [x, y] (16, 32 centre l'icône au bas)
        popupAnchor: [0, -32] // Point où le popup s'affiche par rapport à l'ancrage
    });
    
    function addMarkers(data) {
        markersCluster.clearLayers(); 
        allMarkers = []; 
        let lastActiveMarker = null; 
    
        data.forEach(function(item) { 

            let itemId = item.id ?? null;
            let itemAdresse = item.adresse ?? null;
            let itemLibOfficiel = item.lib_off ?? null;
            let itemMotDirection = item.mot_dir ?? null;
            let itemSensCirculation = item.sens_circulation ?? null;
            let itemCommune = item.commune ?? null;
            let itemCodeINSEE = item.code_insee ?? null;
            let itemDebutComptage = item.debut_comptage ?? null;
            let itemLatitude = item.geo_point_2d?.lat ?? null;
            let itemLongitude = item.geo_point_2d?.lon ?? null;

            if (itemLatitude && itemLongitude) {
                
                let marker = L.marker([itemLatitude, itemLongitude], { icon: customIcon });

                let popupContent = `
                    <div>
                        <h3>${itemLibOfficiel ?? "Sans titre"}</h3>
                        <p><strong>Adresse:</strong> ${itemAdresse ?? "Non spécifiée"}</p>
                        <p><strong>Direction:</strong> ${itemMotDirection ?? "Non spécifiée"}</p>
                        <p><strong>Sens de circulation:</strong> ${itemSensCirculation ?? "Non spécifié"}</p>
                        <p><strong>Commune:</strong> ${itemCommune ?? "Non spécifiée"}</p>
                        <p><strong>Code INSEE:</strong> ${itemCodeINSEE ?? "Non spécifié"}</p>
                        <p><strong>Début comptage:</strong> ${itemDebutComptage ?? "Non spécifié"}</p>
                    </div>
                `;
                marker.bindPopup(popupContent);

                marker.on('click', function() {
                    if (lastActiveMarker) {
                        lastActiveMarker.closePopup();
                    }
                    lastActiveMarker = marker;
                });

                allMarkers.push(marker);
                markersCluster.addLayer(marker);
            }
        });

        map.addLayer(markersCluster);
    }

    $.ajax({
        url: 'js/data.json', 
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            addMarkers(data);
        },
        error: function(xhr, status, error) {
            console.error('Erreur lors de la récupération des données :', error);
        }
    });

    function filterMarkers() {
        var comptageFilters = {
            '2019': $('#2019').hasClass('filter-active'),
            '2020': $('#2020').hasClass('filter-active'),
            '2021': $('#2021').hasClass('filter-active'),
            '2022': $('#2022').hasClass('filter-active'),
            '2023': $('#2023').hasClass('filter-active'),
            '2024': $('#2024').hasClass('filter-active'),
        };
    
        var toulouseFilterActive = $('#toggle-toulouse').hasClass('filter-active');
    
        var sensFilters = {
            'double sens': $('#double-sens').hasClass('filter-active'),
            'sens unique': $('#sens-unique').hasClass('filter-active'),
        };
    
        var filteredMarkers = allMarkers.filter(function(marker) {
            let popupContent = marker.getPopup().getContent();
            
            // Remplacer la vérification de Toulouse dans le popup par une condition sur itemCommune
            let itemCommune = marker.options.itemCommune;  // Assurez-vous que cette information est disponible
    
            let matchesComptageFilter = Object.keys(comptageFilters).some(function(key) {
                return comptageFilters[key] ? popupContent.includes(key) : false;
            }) || !Object.values(comptageFilters).includes(true);
    
            // Filtrage de Toulouse basé sur la valeur de `itemCommune`
            let matchesToulouseFilter = toulouseFilterActive ? itemCommune === 'Toulouse' : true;
    
            let matchesSensFilter = Object.keys(sensFilters).some(function(key) {
                return sensFilters[key] ? popupContent.includes(key) : false;
            }) || !Object.values(sensFilters).includes(true);
    
            return matchesComptageFilter && matchesToulouseFilter && matchesSensFilter;
        });
    
        markersCluster.clearLayers();
        markersCluster.addLayers(filteredMarkers);
    }
    
    function handleFilterClick(filterId, otherFilterIds) {
        $(filterId).on('click', function() {
            $(this).toggleClass('filter-active');

            if ($(this).hasClass('wait-button')) {
                $(this).toggleClass('button-active');
            }
            
            if ($(this).hasClass('filter-active') && otherFilterIds && Array.isArray(otherFilterIds)) {
                otherFilterIds.forEach(function(otherFilterId) {
                    $(otherFilterId).removeClass('filter-active button-active');
                });
            }

            filterMarkers(); 
        });
    }

    function handleToggleClick(toggleId) {
        $(toggleId).on('click', function() {
            const parentElement = document.querySelector(toggleId);
            const childElement = document.querySelector(`${toggleId} > div`);
            
            if ($(this).toggleClass('filter-active').hasClass('filter-active')) {
                parentElement.classList.remove("toggle-to-anim-parent-reverse");
                childElement.classList.remove("toggle-to-anim-enfant-reverse");
                parentElement.classList.add("toggle-to-anim-parent");
                childElement.classList.add("toggle-to-anim-enfant");
            }  

            setTimeout(2000, afterReset);
            

            filterMarkers(); 
        });
    }

    function afterReset(){
        parentElement.classList.remove("toggle-to-anim-parent");
        childElement.classList.remove("toggle-to-anim-enfant");
        parentElement.classList.add("toggle-to-anim-parent-reverse");
        childElement.classList.add("toggle-to-anim-enfant-reverse");
    }

    handleFilterClick('#2020', false);
    handleFilterClick('#2021', false);
    handleFilterClick('#2022', false);
    handleFilterClick('#2023', false);
    handleToggleClick('#reset');

    handleFilterClick('#double-sens', ['#sens-unique']);
    handleFilterClick('#sens-unique', ['#double-sens']);

    let btnFullScreen = document.querySelector("#full");
    let theMap = document.querySelector("#map");

    function mapFullScreen() {
        if (!theMap.classList.contains("map-full-screen")) {
            theMap.classList.add("map-full-screen");
            document.querySelector("#full > img").src = "media/maximize.png";
            console.log("test");
            map.invalidateSize();
        } else if (theMap.classList.contains("map-full-screen")) {
            theMap.classList.remove("map-full-screen");
            document.querySelector("#full > img").src = "media/maximize.png";
            
            map.invalidateSize();
        }
    }

    btnFullScreen.addEventListener("click", mapFullScreen);

});