import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.0/firebase-app.js";
import {
  getDatabase,
  ref,
  update,
  onValue,
  query,
  startAt,
  orderByChild,
  get,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/9.19.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://safejourney-bf819-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const nickName = document.getElementById("nickname");
const addBtn = document.getElementById("addBtn");
const showList = document.getElementById("showList");
const locationList = document.getElementById("locationList");
const arrow = document.getElementById("arrow");

addBtn.addEventListener("click", () => {
  if (nickName.value == "") {
    alert("You must enter a nickname!");
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(setLocation);
      
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }
});

function setLocation(position) {
  const userLocation = {
    label: nickName.value,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: Date.now(),
  };
  const updates = {};
  updates["/locations/" + nickName.value] = userLocation;
  update(ref(database), updates);
  console.log(`${nickName.value} updated`);
  getLocations();
}

let markers = [];

let map;
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  map = new Map(document.getElementById("locations"), {
    center: { lat: 41.2797, lng: 36.3361 }, // Sam sun, TR
    zoom: 12,
    mapId: "1cba8dbadb4e76cc"
  });
  window.AdvancedMarkerElement = AdvancedMarkerElement;
}

window.initMap = initMap();

function getLocations() {
  const now = Date.now();
  const oneMinuteAgo = now - (10 * 1000);
  console.log("zaman => ", now)
  const onlyOnline = query(ref(database, "locations"), orderByChild('timestamp'), startAt(oneMinuteAgo));
  onValue(onlyOnline, (snapShot) => {
    const data = snapShot.val();
    if(data){
      const infoWindow = new google.maps.InfoWindow(); // Marker Info
      removeMarkers();
      markers = [];

      let recentLocation = null;


      Object.values(data).map((locData) => {

        const markerContent = document.createElement("div");
        markerContent.style.width = "32px";
        markerContent.style.height = "32px";
        markerContent.style.backgroundImage = `url("img/navigation.png")`; // Use your image path here
        markerContent.style.backgroundSize = "contain";
        markerContent.style.backgroundRepeat = "no-repeat";
        markerContent.style.backgroundPosition = "center";


        const newMarker = new google.maps.marker.AdvancedMarkerElement({
          position: new google.maps.LatLng(locData.latitude, locData.longitude),
          map: map,
          content: markerContent,
          title: locData.label
        });
        newMarker.addListener("click", () => {
          infoWindow.close();
          infoWindow.setContent(newMarker.title);
          infoWindow.open(newMarker.map, newMarker);
        });
        markers.push(newMarker);

        // Track the most recent location
        if (!recentLocation || locData.timestamp > recentLocation.timestamp) {
          recentLocation = locData;
        }

      });

      if (recentLocation) {
        map.setCenter(new google.maps.LatLng(recentLocation.latitude, recentLocation.longitude));
        map.setZoom(15); // Optional: Adjust zoom level as needed
      }

      showMarkers();
    }else{
      console.log("uygun veri yok.")
    }
  });
}

const setMapOnAll = (map) => {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
};

const showMarkers = () => {
  setMapOnAll(map);
};

const removeMarkers = () => {
  setMapOnAll(null);
  markers = [];
}; 

showList.addEventListener('click', ()=>{
  if(locationList.classList.value === "hide"){
    locationList.className = "show"
    arrow.className = "arrow up"

    get(query(ref(database, 'locations'),orderByChild('timestamp'), limitToLast(7))).then((snapshot) => {
      if (snapshot.exists()) {
        locationList.innerHTML = Object.values(snapshot.val()).map((location)=>{
            return `<li><b>${location.label}</b> - ${location.latitude.toString().slice(0, 6)} ° N, ${location.longitude.toString().slice(0, 6)} ° E</li>`
        }).join('');
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
    
  }else{
    locationList.className = "hide"
    arrow.className = "arrow down"
  }
});

console.log("Init database => ", database);