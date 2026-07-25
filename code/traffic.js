
    const API_KEY = 'F0NYViiuoNHsPH9ARsAgmk5Gg134uGJ8';

    

    //const params = new URLSearchParams(window.location.search);
    //const lat = parseFloat(params.get('lat')) || 38.25;  
    //const lng = parseFloat(params.get('lng')) || 21.73;
    const data = JSON.parse(localStorage.getItem('weatherData'));
    const lat = data.latitude;
    const lng = data.longitude; 

    // map creation
    const map = tt.map({
      key: API_KEY,
      container: 'map',
      center: [lng, lat],
      zoom: 13
    });

    // tomtom controls
    map.addControl(new tt.FullscreenControl());
    map.addControl(new tt.NavigationControl());

    // emoji icons
    function getEmojiFromIconCategory(category) {
      
      const emojiMap = {
        0: '⚠️',
        1: '🚗',
        2: '🌫️',
        3: '⚠️',
        4: '🌧️',
        5: '❄️',
        6: '🚦',
        7: '🚧',
        8: '⛔',
        9: '🛠️',
        10: '💨',
        11: '🌊',
        14: '🔧'
      };
      return emojiMap[category] || '❔';
    }

    // explanation emoji
    function getEmojiDescription(category) {
      
      const emojidescriptionMap = {
        0: 'Άγνωστο συμβάν',
        1: 'Ατύχημα',
        2: 'Ομίχλη',
        3: 'Επικίνδυνες συνθήκες',
        4: 'Βροχή',
        5: 'Πάγος',
        6: 'Συμφόρηση',
        7: 'Λωρίδα κλειστή',
        8: 'Δρόμος κλειστός',
        9: 'Κατασκευαστικά έργα',
        10: 'Ισχυρός άνεμος',
        11: 'Πλημμύρα',
        14: 'Ακινητοποιημένο όχημα'
      };
      return emojidescriptionMap[category] || 'Άγνωστη κατηγορία';
    }

    // incident markers array
    let incidentMarkers = [];

    // load incidents from API
    function loadIncidents() {
      // remove old markers
      incidentMarkers.forEach(m => m.remove());
      incidentMarkers = [];

      // tomtom tool to get the current map bounds
      const bounds = map.getBounds();
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];

      // allowed incident types
      const allowedTypes = '0,1,2,3,4,5,6,7,8,9,10,11,14';

      // url for fetching traffic incidents
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${bbox.join(',')}&key=${API_KEY}&language=en-GB&projection=WGS84&incidentFilter=${allowedTypes}`;

      // get incidents from API
      fetch(url)
        .then(res => res.json())
        .then(data => {
          data.incidents.forEach(incident => {
            const props = incident.properties;
            const [lon, lat] = incident.geometry.coordinates[0];
            const categ = props.iconCategory;

            // allows user to click on the marker to see more details
            const emoji = getEmojiFromIconCategory(categ);
            const description = getEmojiDescription(categ);

            // create a custom icon element
            const icon = document.createElement('div');
            icon.className = 'custom-icon';
            icon.innerText = emoji;

            // extra information in the popup
            const popupHTML = `
              <div style="text-align:center; font-size:16px;">
                <strong>${description}</strong>
              </div>
            `;

            // add the marker to the map
            const marker = new tt.Marker({ element: icon })
              .setLngLat([lon, lat])
              .addTo(map)
              .setPopup(new tt.Popup({ offset: 30 }).setHTML(popupHTML));

            incidentMarkers.push(marker);
          });
        });
    }

    // on map load, add traffic layer and load incidents
    map.on('load', () => {
      // traffic flow layer
      map.addSource('traffic-flow-source', {
        type: 'raster',
        tiles: [
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${API_KEY}`
        ],
        tileSize: 256
      });

      map.addLayer({
        id: 'traffic-flow-layer',
        type: 'raster',
        source: 'traffic-flow-source',
        minzoom: 0,
        maxzoom: 22
      });

      // load incidents
      loadIncidents();

      // load incidents when the map is moved or zoomed
      map.on('moveend', loadIncidents);
    });