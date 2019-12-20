if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

//move map up on document scroll
document.addEventListener('scroll', () => document.getElementById('Map').style['marginTop'] = -parseInt(window.pageYOffset / 2) + 'px');

const tabs = document.querySelectorAll('.tab');
const locations = document.getElementById('locations');
const layers = document.getElementById('layers');
const filters = document.getElementById('filters');

tabs.forEach(tab => {
  tab.querySelector('.listview').addEventListener('scroll',
    e => {
      if (e.target.scrollTop > 0) return e.target.classList.add('shadow');
      e.target.classList.remove('shadow');
    });

  tab.onclick = e => {
    if (!e.target.classList.contains('tab')) return;
    e.preventDefault();
    tabs.forEach(el => el.classList.remove('active'));
    e.target.classList.add('active');
  }
});


_xyz({
  host: document.head.dataset.dir || new String(''),
  token: document.body.dataset.token,
  log: document.body.dataset.log,
  nanoid: document.body.dataset.nanoid,
  hooks: true,
  callback: init,
});

function init(_xyz) {

  if (document.body.dataset.token) {
    _xyz.user = _xyz.utils.JWTDecode(document.body.dataset.token);
  }

  // Create mapview control.
  _xyz.mapview.create({
    target: document.getElementById('Map'),
    attribution: {
      logo: _xyz.utils.wire()`
          <a
            class="logo"
            target="_blank"
            href="https://geolytix.co.uk"
            style="background-image: url('https://cdn.jsdelivr.net/gh/GEOLYTIX/geolytix/public/geolytix.svg');">`
    },
    view: {
      lat: _xyz.hooks.current.lat,
      lng: _xyz.hooks.current.lng,
      z: _xyz.hooks.current.z
    },
    scrollWheelZoom: true,
  });


  const btnZoomIn = _xyz.utils.wire()`
  <button
    disabled=${_xyz.map.getView().getZoom() >= _xyz.workspace.locale.maxZoom}
    class="enabled"
    title="Zoom in"
    onclick=${e => {
      const z = parseInt(_xyz.map.getView().getZoom() + 1);
      _xyz.map.getView().setZoom(z);
      e.target.disabled = (z >= _xyz.workspace.locale.maxZoom);
    }}><div class="xyz-icon icon-add">`;

  document.querySelector('.btn-column').appendChild(btnZoomIn);

  const btnZoomOut = _xyz.utils.wire()`
  <button
    disabled=${_xyz.map.getView().getZoom() <= _xyz.workspace.locale.minZoom}
    class="enabled"
    title="Zoom out"
    onclick=${e => {
      const z = parseInt(_xyz.map.getView().getZoom() - 1);
      _xyz.map.getView().setZoom(z);
      e.target.disabled = (z <= _xyz.workspace.locale.minZoom);
    }}><div class="xyz-icon icon-remove">`;

  document.querySelector('.btn-column').appendChild(btnZoomOut);  

  _xyz.mapview.node.addEventListener('changeEnd', () => {
    const z = _xyz.map.getView().getZoom();
    btnZoomIn.disabled = z >= _xyz.workspace.locale.maxZoom;
    btnZoomOut.disabled = z <= _xyz.workspace.locale.minZoom;
  });


  if (_xyz.workspace.locale.locate) {

    document.querySelector('.btn-column').appendChild(_xyz.utils.wire()`
    <button title="Current location"
      onclick=${e => {
        _xyz.mapview.locate.toggle();
        e.target.classList.toggle('enabled');
      }}><div class="xyz-icon icon-gps-not-fixed off-black-filter">`);

    // Locator
    _xyz.mapview.locate.icon = {
      url: "https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-pin_locate.svg",
      anchor: [0.5, 1],
      scale: 0.5
    }
  }


  const layer = _xyz.layers.list['Advice Center'];


  const table = _xyz.dataview.layerTable({
    layer: layer,
    target_id: 'layers',
    key: 'gla',
    visible: ['organisation_short'],
    layout: "fitColumns",
    initialSort: [
      {
        column: 'organisation_short', dir: 'asc'
      }
    ],
    groupStartOpen: false,
    groupToggleElement: 'header',
    rowClick: (e, row) => {
      _xyz.locations.select({
        locale: _xyz.workspace.locale.key,
        layer: layer,
        table: layer.table,
        id: row.getData().qid,
        _flyTo: true,
      });
    }
  });





  if (_xyz.workspace.locale.gazetteer) {

    const gazetteer = _xyz.utils.wire()`
    <div id="gazetteer" class="display-none">
      <div class="input-drop">
          <input type="text" placeholder="e.g. London">
          <ul>`;

    const btnGazetteer = _xyz.utils.wire()`
    <button onclick=${e=>{
      e.preventDefault();
      e.target.classList.toggle('enabled');
      gazetteer.classList.toggle('display-none');
    }}><div class="xyz-icon icon-search">`;

    document.querySelector('.btn-column').insertBefore(btnGazetteer,document.querySelector('.btn-column').firstChild);

    document.body.insertBefore(gazetteer, document.querySelector('.btn-column'));

    _xyz.gazetteer.init({
      group: gazetteer.querySelector('.input-drop'),
    });

    _xyz.gazetteer.icon = {
      url: "https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-pin_gazetteer.svg",
      anchor: [0.5, 1],
      scale: 0.5
    }

    _xyz.gazetteer.callback = point => {

      const xhr = new XMLHttpRequest();
  
      xhr.open('GET',
        _xyz.host + '/api/location/select/latlng/nnearest?' +
        _xyz.utils.paramString({
          locale: _xyz.workspace.locale.key,
          layer: 'Advice Center',
          table: 'gla.gla',
          nnearest: 3,
          lng: point.coordinates[0],
          lat: point.coordinates[1],
          filter: JSON.stringify(layer.filter.current),
        }));

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.responseType = 'json';

      xhr.onload = e => {

        if (e.target.status !== 200) return;

        const geoJSON = new _xyz.mapview.lib.format.GeoJSON();

        const features = [];

        e.target.response.forEach(f => {

          features.push(geoJSON.readFeature({
            type: 'Feature',
            geometry: JSON.parse(f.geomj)
          }, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }));

        });

        const gazSource = _xyz.gazetteer.layer.getSource();

        gazSource.addFeatures(features);

        _xyz.mapview.flyToBounds(_xyz.gazetteer.layer.getSource().getExtent());

        features.forEach(f => gazSource.removeFeature(f));

      };

      xhr.send();

    }
  }





  _xyz.locations.listview.init = () => {

    _xyz.locations.listview.node = locations;

    _xyz.locations.listview.node.innerHTML = '';

    _xyz.locations.list = [
      {
        color: '#00AEEF',
        colorDark: '#007BBC',
        marker: {
          url: "https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-pin_blue.svg",
          anchor: [0.5, 1],
          scale: 0.5
        },
      },
      {
        color: '#008D48',
        colorDark: '#005A15',
        marker: {
          url: "https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-pin_green.svg",
          anchor: [0.5, 1],
          scale: 0.5
        },
      },
      {
        color: '#E85713',
        colorDark: '#CF3E00',
        marker: {
          url: "https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-pin_orange.svg",
          anchor: [0.5, 1],
          scale: 0.5
        },
      }
    ];

    locations.closest('.tab').style.display = 'none';
    layers.closest('.tab').click();
  }

  _xyz.locations.listview.init();


  _xyz.locations.selectCallback = location => {
 
    // Draw location marker.
    location.Marker = _xyz.mapview.geoJSON({
      geometry: {
        type: 'Point',
        coordinates: location.marker,
      },
      style: new _xyz.mapview.lib.style.Style({
        image: _xyz.mapview.icon(location.record.marker)
      })
    });

    const fields = {};

    location.infoj.forEach(el => {

      if (el.value) fields[el.field] = el.value;

    });

    location.view = _xyz.utils.wire()`<div class="location" style="${'font-size: 14px; margin-bottom: 20px; border: 3px solid ' + location.record.color}">`;

    const header = _xyz.utils.wire()`<div style="display: grid; grid-gap: 5px; grid-template-columns: auto 30px 30px;">`;

    location.view.appendChild(header);

    header.appendChild(_xyz.utils.wire()`<div style="grid-column: 1" class="title">${fields.organisation_short}`);

    const title_expand = _xyz.utils.wire()`<div style="grid-column: 2;" class="title-btn expander">`;

    header.appendChild(title_expand);

    const title_close = _xyz.utils.wire()`<div style="grid-column: 3;" class="title-btn exit">`;

    header.appendChild(title_close);


    title_expand.onclick = function (e) {

      const loc = e.target.parentNode.parentNode;

      loc.classList.toggle('collapsed');

    };

    title_close.onclick = function () {
      location.remove();
    };



    var viewGrid = _xyz.utils.wire()`<div class="grid _grid" style="grid-template-columns: 20px 1fr 20px 1fr;">`;

    viewGrid.appendChild(
      _xyz.utils.wire()`<div style="grid-column: 1; grid-row: 1;"><div style="background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon_location.svg);" class="location_drop">`);

    var viewAddress = _xyz.utils.wire()`<div style="grid-column: 2; grid-row: 1/4;">`;

    if (fields.address1) viewAddress.appendChild(
      _xyz.utils.wire()`<div>${fields.address1}`
    );

    if (fields.address2) viewAddress.appendChild(
      _xyz.utils.wire()`<div>${fields.address2}`
    );

    if (fields.address3) viewAddress.appendChild(
      _xyz.utils.wire()`<div>${fields.address3}`
    );

    if (fields.address4) viewAddress.appendChild(
      _xyz.utils.wire()`<div>${fields.address4}`
    );

    if (fields.postcode) viewAddress.appendChild(
      _xyz.utils.wire()`<div>${fields.postcode}`
    );

    viewGrid.appendChild(viewAddress);

    if (fields.website) {
      viewGrid.appendChild(
        _xyz.utils.wire()`
        <div style="grid-column: 3; grid-row: 1; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon_link.svg);" class="location_icon">`);

      viewGrid.appendChild(
        _xyz.utils.wire()`
          <a style="grid-column: 4; grid-row: 1;" href="${fields.website}">Website</a>`);
    }

    if (fields.phone) {
      viewGrid.appendChild(
        _xyz.utils.wire()`
          <div style="grid-column: 3; grid-row: 2; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon_phone.svg);" class="location_icon">`);
      viewGrid.appendChild(
        _xyz.utils.wire()`
          <div style="grid-column: 4; grid-row: 2;">${fields.phone}`);
    }

    if (fields.email) {
      viewGrid.appendChild(
        _xyz.utils.wire()`
          <div style="grid-column: 3; grid-row: 3; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon_email.svg);" class="location_icon">`);
      viewGrid.appendChild(
        _xyz.utils.wire()`
          <a style="grid-column: 4; grid-row: 3;" href="${'mailto:' + fields.email}">Email</a>`);
    }
    if (fields.coverage) {

      viewGrid.appendChild(_xyz.utils.wire()`
          <div style="
          grid-column: 1;
          grid-row: 5;
          background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-catchment.svg);
          height: 30px;
          background-size: contain;
          background-repeat: no-repeat;">`);

      viewGrid.appendChild(_xyz.utils.wire()`
          <div style="grid-column: 2/5; grid-row: 5;">${fields.coverage}`);     

    }

    location.view.appendChild(viewGrid);

    var viewGrid = _xyz.utils.wire()`<div style="display: grid; grid-gap:0px; grid-template-columns: 50px;">`;

    var gridRow = 1;

    var el = _xyz.utils.wire()`
        <div style="grid-column: 1/4; font-weight: bold; line-height: 2; font-size: 14px;">Opening Hours:`;
    el.style.gridRow = gridRow;
    viewGrid.appendChild(el);

    gridRow++;

    if (
      fields.phone_sunday ||
      fields.phone_monday ||
      fields.phone_tuesday ||
      fields.phone_wednesday ||
      fields.phone_thursday ||
      fields.phone_friday ||
      fields.phone_saturday) {

      var el = _xyz.utils.wire()`<div style="grid-column: 2; font-weight: bold;">Telephone`;
      el.style.gridRow = gridRow;
      viewGrid.appendChild(el);
    }

    if (
      fields.hours_sunday ||
      fields.hours_monday ||
      fields.hours_tuesday ||
      fields.hours_wednesday ||
      fields.hours_thursday ||
      fields.hours_friday ||
      fields.hours_saturday) {

      var el = _xyz.utils.wire()`<div style="grid-column: 3; font-weight: bold;">Face-to-face`;
      el.style.gridRow = gridRow;
      viewGrid.appendChild(el);
    }

    gridRow++;

    gridRow = hours(gridRow, 'Sun', fields.hours_sunday, fields.phone_sunday);

    gridRow = hours(gridRow, 'Mon', fields.hours_monday, fields.phone_monday);

    gridRow = hours(gridRow, 'Tue', fields.hours_tuesday, fields.phone_tuesday);

    gridRow = hours(gridRow, 'Wed', fields.hours_wednesday, fields.phone_wednesday);

    gridRow = hours(gridRow, 'Thu', fields.hours_thursday, fields.phone_thursday);

    gridRow = hours(gridRow, 'Fri', fields.hours_friday, fields.phone_friday);

    gridRow = hours(gridRow, 'Sat', fields.hours_saturday, fields.phone_saturday);

    function hours(gridRow, day, hours, phone) {
      if (hours || phone) {
        var el = _xyz.utils.wire()`
            <div style="grid-column: 1; font-weight: bold;">${day}`;
        el.style.gridRow = gridRow;
        viewGrid.appendChild(el);

        if (hours) {
          var el = _xyz.utils.wire()`
              <div style="grid-column: 3;">${hours}`;
          el.style.gridRow = gridRow;
          viewGrid.appendChild(el);
        }

        if (phone) {
          var el = _xyz.utils.wire()`
              <div style="grid-column: 2;">${phone}`;
          el.style.gridRow = gridRow;
          viewGrid.appendChild(el);
        }

        gridRow++;

        return gridRow;
      }

      return gridRow;
    }

    if (fields.phone_notes) {
      var el = _xyz.utils.wire()`
          <div style="grid-column: 1/4; white-space: pre-wrap;">${fields.phone_notes}`;
      el.style.gridRow = gridRow;
      viewGrid.appendChild(el);
      gridRow++;
    }

    if (fields.hours_notes) {
      var el = _xyz.utils.wire()`
          <div style="grid-column: 1/4; white-space: pre-wrap;">${fields.hours_notes}`;
      el.style.gridRow = gridRow;
      viewGrid.appendChild(el);
      gridRow++;
    }

    location.view.appendChild(viewGrid);

    var viewGrid = _xyz.utils.wire()`<div class="grid _grid" style="grid-template-columns: 20px">`;

    viewGrid.appendChild(_xyz.utils.wire()`<div style="grid-column: 1/5; grid-row: 1; font-weight: bold; line-height: 2; font-size: 14px;">Services offered:`)

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="${'grid-column: 1; grid-row: 2; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/'+ (fields.service_initial_advice ? 'icon_checked' : 'icon_unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="grid-column: 2; grid-row: 2;">One-off initial advice.`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="${'grid-column: 1; grid-row: 3; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/'+ (fields.service_written_advice ? 'icon_checked' : 'icon_unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="grid-column: 2; grid-row: 3;">Written advice.`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="${'grid-column: 1; grid-row: 4; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/'+ (fields.service_form_filling ? 'icon_checked' : 'icon_unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="grid-column: 2; grid-row: 4;">Help with filling in forms.`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="${'grid-column: 1; grid-row: 5; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/'+ (fields.service_case_work ? 'icon_checked' : 'icon_unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="grid-column: 2; grid-row: 5;">Help with putting a case together for court.`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="${'grid-column: 1; grid-row: 6; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/'+ (fields.service_representation ? 'icon_checked' : 'icon_unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

    viewGrid.appendChild(_xyz.utils.wire()`
    <div style="grid-column: 2; grid-row: 6;">Representation at court.`);

    location.view.appendChild(viewGrid);

    var viewGrid = _xyz.utils.wire()`<div class="grid _grid" style="grid-template-columns: 30px 1fr 30px 1fr;">`;

    if (fields.translation_notes) {
      viewGrid.appendChild(_xyz.utils.wire()`
        <div style="grid-column: 1; grid-row: 1; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-access.svg); height: 25px; background-size: contain; background-repeat: no-repeat;"></div>`);
      viewGrid.appendChild(_xyz.utils.wire()`
        <div style="grid-column: 2; grid-row: 1;">
          <div style="font-weight: bold">Access</div>
          <div style="white-space: pre-wrap;">${fields.access}</div>`);            
    }

    if (fields.access) {
      viewGrid.appendChild(_xyz.utils.wire()`
        <div style="grid-column: 3; grid-row: 1; background-image: url(https://cdn.jsdelivr.net/gh/GEOLYTIX/gla/icon-translate.svg); height: 25px; background-size: contain; background-repeat: no-repeat;"></div>`);
      viewGrid.appendChild(_xyz.utils.wire()`
        <div style="grid-column: 4; grid-row: 1;">
          <div style="font-weight: bold">Translation</div>
          <div style="white-space: pre-wrap;">${fields.translation_notes}</div>`);          
    }

    location.view.appendChild(viewGrid);

    _xyz.locations.listview.node.insertBefore(location.view, _xyz.locations.listview.node.firstChild);

    locations.closest('.tab').style.display = 'block';

    locations.closest('.tab').click();

    if (window.pageYOffset <= 200) window.scroll({
      top: 200,
      left: 0,
      behavior: 'smooth'
    });

  };  

  // Select locations from hooks.
  _xyz.hooks.current.locations.forEach(_hook => {

    let hook = _hook.split('!');

    _xyz.locations.select({
      locale: _xyz.workspace.locale.key,
      layer: _xyz.layers.list[decodeURIComponent(hook[0])],
      table: hook[1],
      id: hook[2]
    });
  });


  layer.filter.current = { borough: { in: [] } };

  serviceFilter = document.querySelectorAll('.serviceFilter');

  serviceFilter.forEach(input => {

    input.onchange = e => {
      e.stopPropagation();

      if (e.target.checked) {
        layer.filter.current[input.dataset.service] = {};
        layer.filter.current[input.dataset.service]['boolean'] = true;

      } else {

        delete layer.filter.current[input.dataset.service];
      }

      layer.zoomToExtent({ padding: [100, 100, 100, 100] });
      table.update();
    }
  });

  boroughFilter = document.querySelectorAll('.boroughFilter');

  boroughFilter.forEach(input => {

    input.onchange = e => {
      e.stopPropagation();

      if (e.target.checked) {
  
        // Add value to filter array.
        layer.filter.current['borough'].in.push(input.dataset.borough);

      } else {

        // Get index of value in filter array.
        let idx = layer.filter.current['borough']['in'].indexOf(input.dataset.borough);

        // Splice filter array on idx.
        layer.filter.current['borough'].in.splice(idx, 1);
      }

      layer.zoomToExtent({ padding: [100, 100, 100, 100] });
      table.update();
    }
  });

}
