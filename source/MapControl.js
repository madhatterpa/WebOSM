/*
A map control which is a wrapper around Leaflet map control.

To initialize a Map control:

	{name: "map", kind: "MapControl", credentials: "my_cloudmade_credentials"}
	
You can get a handle to the actual Leaflet map control uisng hasMap(), like this:

	var mapControl = this.$.map.hasMap();
	
*/

enyo.kind({
	name: "WebOSM.MapControl", 
	kind: "enyo.Control",
	published: {
		credentials: "",
		mapType: "road",
		db: ""
	},
	events: {
		onLocationFound: "",
		onLocationError: ""
	},
	
	create: function() {
		this.inherited(arguments);
		// Use Canvas fallback instead of SVG, because WebOS do not handle it very well.
		L.Path.SVG = false;
	},

	rendered: function() {
		this.renderMap();
	},
	
	createMap: function(){
		this.map = new L.Map(this.hasNode(), {zoomControl : false, attributionControl: false});
		this.layerGroup = new L.LayerGroup();
		this.userGPSPosition = new L.LayerGroup();
	},
	
	destroyMap: function(){
		this.map = null;
	},
	
	renderMap: function() {
		this.destroyMap();
		try {
			this.createMap();
		} catch (e) {
//			this.doLoadFailure(e);
			return;
		}
		
		// create a CloudMade tile layer
		var cloudMade = new L.TileLayer('http://{s}.tile.cloudmade.com/' + this.credentials + '/997/256/{z}/{x}/{y}.png',
			{
				maxZoom: 18
			}
		);
		
		// create a OpenAerials tile layer
		var openAerials = new L.TileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png',
			{
				maxZoom: 18,
				subdomains: ['oatile1', 'oatile2', 'oatile3', 'oatile4']
			}
		);
		
		this.baseMaps = {
			"road": cloudMade,
			"satellite": openAerials
		};

		// add the CloudMade layer to the map and set the view to a given center
		this.map.addLayer(cloudMade).setView(new L.LatLng(51.505, -0.09), 3);
		this.map.addLayer(this.layerGroup);
		this.map.addLayer(this.userGPSPosition);
		this.connectEvents();
		this.mapTypeChanged();
	},
	
	hasMap: function() {
		return this.map;
	},
	
	hasLayers: function() {
		return this.layerGroup;
	},
	
	hasGPSLayers: function() {
		return this.userGPSPosition;
	},
	
	clearAll: function() {
		this.layerGroup.clearLayers();
	},
	
	clearGPSLayer: function() {
		this.userGPSPosition.clearLayers();
	},
	
	connectEvents: function() {
		this.map.on('locationfound', enyo.bind(this, "gotLocation"));
		this.map.on('locationerror', enyo.bind(this, "gotLocationError"));
	},
	
	gotLocationError: function(e) {
		this.doLocationError(e);
	},
	
	gotLocation: function(e) {
		this.doLocationFound(e);
	},
	
	mapTypeChanged: function() {
		if (this.mapType === "road"){
			this.map.removeLayer(this.baseMaps.satellite);
			if(typeof(this.baseMaps.offline) != 'undefined'){
				this.map.removeLayer(this.baseMaps.offline);
			}
			this.map.addLayer(this.baseMaps.road);
		}
		else if (this.mapType === "satellite"){
			this.map.removeLayer(this.baseMaps.road);
			if(typeof(this.baseMaps.offline) != 'undefined'){
				this.map.removeLayer(this.baseMaps.offline);
			}
			this.map.addLayer(this.baseMaps.satellite);
		}
		else {
			if(typeof(this.baseMaps.offline) != 'undefined'){
				this.map.removeLayer(this.baseMaps.road);
				this.map.removeLayer(this.baseMaps.satellite);
				this.map.addLayer(this.baseMaps.offline);
			}
		}
	},
	
	dbChanged: function(){
		this.log("test" + this.db);
		// create a Offline tile layer
		var offline = new L.TileLayer.MBTiles('',
			{
				maxZoom: 14,
				scheme: 'tms'
			}, this.db);
		this.baseMaps.offline = offline;
		this.setMapType("offline");
	}
});
