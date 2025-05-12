'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.name} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  name = 'Running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  name = 'Cycling';
  constructor(coords, distance, duration, eleveGain) {
    super(coords, distance, duration);
    this.eleveGain = eleveGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// APPLICATION ARCITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];
  // deleteOne;

  constructor() {
    // Loading the map
    this._getPosition();

    // Get Local Storage
    this._getLocalStorage();

    // Creating ne form
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Toggle Exercise type
    inputType.addEventListener('change', this._toggleElevationField);

    // Move to marker on click
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // Delete One
    containerWorkouts.addEventListener('click', this._deleteOne.bind(this));
  }

  _getPosition() {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("We Could't Get Your Position, Allow this site to access your location");
      }
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on the map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    // Hide the form
    form.classList.add('hidden');
  }

  _toggleElevationField() {
    inputElevation.closest('div').classList.toggle('form__row--hidden');
    inputCadence.closest('div').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Chack for valid inputs
    const validateInput = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const postiveInputs = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from the form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng; // from the this._showForm()

    let workout;
    // If workout is Running create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !validateInput(distance, duration, cadence) ||
        !postiveInputs(distance, duration, cadence)
      )
        return alert('Inputs have to be Positive numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is Cycling create Cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validateInput(distance, duration, elevation) ||
        !postiveInputs(distance, duration)
      )
        return alert('Inputs have to be Positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new Object to workout array
    this.#workouts.push(workout);
    // console.log(workout);

    // Render Workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render Workout on List
    this._renderWorkout(workout);

    // Hide the form
    this._hideForm();

    // Store Workouts in Local Storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name.toLowerCase()}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'Running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = `<li class="workout workout--${workout.name.toLowerCase()}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <button class='delete-one'>Delete</button>
    <div class="workout__details">
        <span class="workout__icon">${
          workout.name === 'Running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.name === 'Running' ? workout.cadence : workout.eleveGain
        }</span>
        <span class="workout__unit">${
          workout.name === 'Running' ? 'min/km' : 'km/h'
        }</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">${
          workout.name === 'Running' ? '🦶🏼' : '⛰'
        }</span>
        <span class="workout__value">${
          workout.name === 'Running'
            ? workout.pace.toFixed(1)
            : workout.speed.toFixed(1)
        }</span>
        <span class="workout__unit">${
          workout.name === 'Running' ? 'spm' : 'm/s'
        }</span>
    </div>
    
  </li>`;
    // console.log(workout.name.toLowerCase());

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    // console.log(workoutEl);

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    const [lat, lng] = workout.coords;
    this.#map.panTo([lat, lng]);
  }

  // Setting local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // Getting the local Storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    // console.log(this.#workouts);

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
    // console.log(data);
  }

  // Resetting our App
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  // Delete One Workout
  _deleteOne(e) {
    if (!e.target.classList.contains('delete-one')) return;

    const currentWorkout = e.target.closest('.workout');
    const data = this.#workouts.find(
      work => work.id === currentWorkout.dataset.id
    );

    this.#workouts = this.#workouts.filter(work => work !== data);
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    location.reload();
  }
}

const app = new App();
// app._showForm();
