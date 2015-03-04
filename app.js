// Google Map map data
var googleMap = null;
function initializeGoogleMap() {
	var mapOptions = {
		center: { lat: 43.060692, lng: -89.504204},
		zoom: 18,
		keyboardShortcuts: true,
		disableDefaultUI: true,
		navigationControl: false,
		mapTypeControl: false,
		scrollwheel: true,
		scaleControl: false,
		draggable: true,
		mapTypeId : google.maps.MapTypeId.SATELLITE
    };
	googleMap = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

// the Restaurant class.  represents an individual restaurant to be shown on the map
var Restaurant = function(name, category, lat, lng) {
	var self = this;

	this.name = ko.observable(name);
	this.category = ko.observable(category);
	this.lat = ko.observable(lat);
	this.lng = ko.observable(lng);
	this.wikipediaDescription = ko.observable("");

	// pans the map over to the restaurant.  triggered by clicking the restaurant's name.
	this.goToRestaurant = function() {
		// "focus" on this restaurant, displaying its details in the right-side panel
		viewModel.focusedRestaurant(self);
		if (googleMap.getZoom() < 18) {
			googleMap.setZoom(18);
		}
		// pan the map over to the restaurant's location
		googleMap.panTo(new google.maps.LatLng(this.lat(), this.lng()));

		// create the Street View
		var panoramaOptions = {
		  position: new google.maps.LatLng(this.lat(), this.lng())
		};
		var panorama = new google.maps.StreetViewPanorama(document.getElementById("street-view-canvas"), panoramaOptions);
		googleMap.setStreetView(panorama);
	};

	// called when this restaurant's map marker gets clicked
	this.markerClicked = function() {
		self.goToRestaurant();
	};

	// the Google Map marker, and functions for showing and hiding it
	this.marker = null;
	this.showMarker = function() {
		if (this.marker == null) {
			// create the marker
			this.marker = new google.maps.Marker({
				position: new google.maps.LatLng(this.lat(), this.lng()),
				title: this.name()
			});
			// give it an event, for if the marker gets clicked
			google.maps.event.addListener(this.marker, 'click', this.markerClicked);
		}
		if (this.marker.getMap() != googleMap)
			this.marker.setMap(googleMap);
	}
	this.hideMarker = function() {
		if (this.marker != null) {
			this.marker.setMap(null);
		}
	}
}

// the class for the view model
var RestaurantFinderViewModel = function() {
	var self = this;
	// create the actual Google map
	initializeGoogleMap();

	// a list of all restaurants (populated later via AJAX)
	this.allRestaurants = ko.observableArray();
	// the text entered into the "Search by name" bar
	this.searchedName = ko.observable("");
	// which restaurant is being focused (after being clicked), to display its details
	this.focusedRestaurant = ko.observable(new Restaurant("", "", "", ""));
	// only show the restaurant details panel (on the right) if there's a restaurant focused
	this.shouldShowFocusedRestaurant = ko.dependentObservable(function() {
		return self.focusedRestaurant().name().length > 0;
	});

	// a computed list of the restaurants shown (from this.allRestaurants, minus the ones filtered out in some way or another)
	this.restaurantsShown = ko.dependentObservable(function() {
		var restaurantsMatched = new Array();
		var searchFilter = this.searchedName().toLowerCase();

		// loop over allRestaurants, adding any restaurants that shouldn't be filtered out.  also, show/hide the map markers for restaurants.
		for (var i = 0; i < this.allRestaurants().length; i++) {
			if (this.allRestaurants()[i]().name().toLowerCase().indexOf(searchFilter) > -1) {
				restaurantsMatched.push(this.allRestaurants()[i]());
				this.allRestaurants()[i]().showMarker(); // show the marker, since it's shown in the results
			} else {
				this.allRestaurants()[i]().hideMarker(); // hide the marker, since it's filtered out of the results
			}
		}
		return restaurantsMatched;
	}, this);

	// use AJAX to dynamically load the restaurant data from a file called restaurants.json
	jQuery.get("restaurants.json", function(data) {
		for (var i = 0; i < data.length; i++) {
			self.allRestaurants.push(ko.observable(new Restaurant(data[i].name, data[i].category, data[i].lat, data[i].lng)));
		}
	})
	.fail(function(data) {
		alert("Could not load JSON data from restaurants.json");
	});
}

// create the view model
var viewModel = new RestaurantFinderViewModel();
ko.applyBindings(viewModel);
