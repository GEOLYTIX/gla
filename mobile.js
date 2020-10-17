window.onload = () => {

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
    host: '/gla',
    locale: 'London',
    hooks: true,
    callback: init,
  });

  function init(xyz) {

    if (document.body.dataset.token) {
      xyz.user = xyz.utils.JWTDecode(document.body.dataset.token);
    }

    // Create mapview control.
    xyz.mapview.create({
      target: document.getElementById('Map'),
      attribution: {
        logo: xyz.utils.html.node`
            <a
              class="logo"
              target="_blank"
              href="https://geolytix.co.uk"
              style="background-image: url('https://geolytix.github.io/public/geolytix.svg');">`
      },
      view: {
        lat: xyz.hooks.current.lat,
        lng: xyz.hooks.current.lng,
        z: xyz.hooks.current.z
      },
      scrollWheelZoom: true,
    });


    const btnZoomIn = xyz.utils.html.node`
    <button
      disabled=${xyz.map.getView().getZoom() >= xyz.workspace.locale.maxZoom}
      class="enabled"
      title="Zoom in"
      onclick=${e => {
        const z = parseInt(xyz.map.getView().getZoom() + 1);
        xyz.map.getView().setZoom(z);
        e.target.disabled = (z >= xyz.workspace.locale.maxZoom);
      }}><div class="xyz-icon icon-add">`;

    document.querySelector('.btn-column').appendChild(btnZoomIn);

    const btnZoomOut = xyz.utils.html.node`
    <button
      disabled=${xyz.map.getView().getZoom() <= xyz.workspace.locale.minZoom}
      class="enabled"
      title="Zoom out"
      onclick=${e => {
        const z = parseInt(xyz.map.getView().getZoom() - 1);
        xyz.map.getView().setZoom(z);
        e.target.disabled = (z <= xyz.workspace.locale.minZoom);
      }}><div class="xyz-icon icon-remove">`;

    document.querySelector('.btn-column').appendChild(btnZoomOut);

    xyz.mapview.node.addEventListener('changeEnd', () => {
      const z = xyz.map.getView().getZoom();
      btnZoomIn.disabled = z >= xyz.workspace.locale.maxZoom;
      btnZoomOut.disabled = z <= xyz.workspace.locale.minZoom;
    });


    document.querySelector('.btn-column').appendChild(xyz.utils.html.node`
      <button title="Current location"
        onclick=${e => {
        xyz.mapview.locate.toggle();
        e.target.classList.toggle('enabled');
      }}><div class="xyz-icon icon-gps-not-fixed off-black-filter">`);

    // Locator
    xyz.mapview.locate.icon = {
      url: "https://geolytix.github.io/gla/icons/pin_locate.svg",
      anchor: [0.5, 1],
      scale: 0.5
    }

    const layer = xyz.layers.list['Advice Center'];


    const table = xyz.dataviews.create({
      target: document.getElementById('layers'),
      query: 'gla_organisation',
      layer: layer,
      table: 'gla.gla',
      viewport: true,
      active: true,
      selectable: true,
      columns: [
        {
          title: 'Organisation',
          field: 'organisation_short'
        }
      ]
    })





    if (xyz.workspace.locale.gazetteer) {

      const gazetteer = xyz.utils.html.node`
      <div id="gazetteer" class="display-none">
        <div class="input-drop">
            <input type="text" placeholder="e.g. London">
            <ul>`;

      const btnGazetteer = xyz.utils.html.node`
      <button onclick=${e => {
          e.preventDefault();
          e.target.classList.toggle('enabled');
          gazetteer.classList.toggle('display-none');
        }}><div class="xyz-icon icon-search">`;

      document.querySelector('.btn-column').insertBefore(btnGazetteer, document.querySelector('.btn-column').firstChild);

      document.body.insertBefore(gazetteer, document.querySelector('.btn-column'));

      xyz.gazetteer.init({
        group: gazetteer.querySelector('.input-drop'),
      });

      xyz.gazetteer.icon = {
        url: "https://geolytix.github.io/gla/icons/pin_gazetteer.svg",
        anchor: [0.5, 1],
        scale: 0.5
      }

      xyz.gazetteer.callback = point => {

        const xhr = new XMLHttpRequest();

        xhr.open('GET',
          xyz.host + '/api/query?' +
          xyz.utils.paramString({
            template: 'get_nnearest',
            locale: xyz.workspace.locale.key,
            layer: 'Advice Center',
            table: 'gla.gla',
            n: 3,
            coords: res.coordinates,
            lng: res.coordinates[0],
            lat: res.coordinates[1],
            filter: JSON.stringify(layer.filter.current),
          }));

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'json';

        xhr.onload = e => {

          if (e.target.status !== 200) return;

          const geoJSON = new ol.format.GeoJSON();

          const features = [];

          e.target.response.forEach(f => {

            features.push(geoJSON.readFeature({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: f.coords
              }
            }, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857'
            }));

          });

          const gazSource = xyz.gazetteer.layer.getSource();

          gazSource.addFeatures(features);

          xyz.mapview.flyToBounds(xyz.gazetteer.layer.getSource().getExtent());

          features.forEach(f => gazSource.removeFeature(f));

        };

        xhr.send();

      }
    }





    xyz.locations.listview.init = () => {

      xyz.locations.listview.node = locations;

      xyz.locations.listview.node.innerHTML = '';

      xyz.locations.list = [
        {
          color: '#00AEEF',
          colorDark: '#007BBC',
          marker: {
            url: "https://geolytix.github.io/gla/icons/pin_blue.svg",
            anchor: [0.5, 1],
            scale: 0.5
          },
        },
        {
          color: '#008D48',
          colorDark: '#005A15',
          marker: {
            url: "https://geolytix.github.io/gla/icons/pin_green.svg",
            anchor: [0.5, 1],
            scale: 0.5
          },
        },
        {
          color: '#E85713',
          colorDark: '#CF3E00',
          marker: {
            url: "https://geolytix.github.io/gla/icons/pin_orange.svg",
            anchor: [0.5, 1],
            scale: 0.5
          },
        }
      ];

      locations.closest('.tab').style.display = 'none';
      layers.closest('.tab').click();
    }

    xyz.locations.listview.init();


    xyz.locations.selectCallback = location => {

      // Draw location marker.
      location.Marker = xyz.mapview.geoJSON({
        geometry: {
          type: 'Point',
          coordinates: location.marker,
        },
        style: new ol.style.Style({
          image: xyz.mapview.icon(location.record.marker)
        })
      });

      const fields = {};

      location.infoj.forEach(el => {

        if (el.value) fields[el.field] = el.value;

      });

      location.view = xyz.utils.html.node`<div class="location" style="${'font-size: 14px; margin-bottom: 20px; border: 3px solid ' + location.record.color}">`;

      const header = xyz.utils.html.node`<div style="display: grid; grid-gap: 5px; grid-template-columns: auto 30px 30px;">`;

      location.view.appendChild(header);

      header.appendChild(xyz.utils.html.node`<div style="grid-column: 1" class="title">${fields.organisation_short}`);

      const title_expand = xyz.utils.html.node`<div style="grid-column: 2;" class="title-btn expander">`;

      header.appendChild(title_expand);

      const title_close = xyz.utils.html.node`<div style="grid-column: 3;" class="title-btn exit">`;

      header.appendChild(title_close);


      title_expand.onclick = function (e) {

        const loc = e.target.parentNode.parentNode;

        loc.classList.toggle('collapsed');

      };

      title_close.onclick = function () {
        location.remove();
      };



      var viewGrid = xyz.utils.html.node`<div class="grid _grid" style="grid-template-columns: 20px 1fr 20px 1fr;">`;

      viewGrid.appendChild(
        xyz.utils.html.node`<div style="grid-column: 1; grid-row: 1;"><div style="background-image: url(https://geolytix.github.io/gla/icons/location.svg);" class="location_drop">`);

      var viewAddress = xyz.utils.html.node`<div style="grid-column: 2; grid-row: 1/4;">`;

      if (fields.address1) viewAddress.appendChild(
        xyz.utils.html.node`<div>${fields.address1}`
      );

      if (fields.address2) viewAddress.appendChild(
        xyz.utils.html.node`<div>${fields.address2}`
      );

      if (fields.address3) viewAddress.appendChild(
        xyz.utils.html.node`<div>${fields.address3}`
      );

      if (fields.address4) viewAddress.appendChild(
        xyz.utils.html.node`<div>${fields.address4}`
      );

      if (fields.postcode) viewAddress.appendChild(
        xyz.utils.html.node`<div>${fields.postcode}`
      );

      viewGrid.appendChild(viewAddress);

      if (fields.website) {
        viewGrid.appendChild(
          xyz.utils.html.node`
          <div style="grid-column: 3; grid-row: 1; background-image: url(https://geolytix.github.io/gla/icons/link.svg);" class="location_icon">`);

        viewGrid.appendChild(
          xyz.utils.html.node`
            <a style="grid-column: 4; grid-row: 1;" href="${fields.website}">Website</a>`);
      }

      if (fields.phone) {
        viewGrid.appendChild(
          xyz.utils.html.node`
            <div style="grid-column: 3; grid-row: 2; background-image: url(https://geolytix.github.io/gla/icons/phone.svg);" class="location_icon">`);
        viewGrid.appendChild(
          xyz.utils.html.node`
            <div style="grid-column: 4; grid-row: 2;">${fields.phone}`);
      }

      if (fields.email) {
        viewGrid.appendChild(
          xyz.utils.html.node`
            <div style="grid-column: 3; grid-row: 3; background-image: url(https://geolytix.github.io/gla/icons/email.svg);" class="location_icon">`);
        viewGrid.appendChild(
          xyz.utils.html.node`
            <a style="grid-column: 4; grid-row: 3;" href="${'mailto:' + fields.email}">Email</a>`);
      }
      if (fields.coverage) {

        viewGrid.appendChild(xyz.utils.html.node`
            <div style="
            grid-column: 1;
            grid-row: 5;
            background-image: url(https://geolytix.github.io/gla/icons/catchment.svg);
            height: 30px;
            background-size: contain;
            background-repeat: no-repeat;">`);

        viewGrid.appendChild(xyz.utils.html.node`
            <div style="grid-column: 2/5; grid-row: 5;">${fields.coverage}`);

      }

      location.view.appendChild(viewGrid);

      var viewGrid = xyz.utils.html.node`<div style="display: grid; grid-gap:0px; grid-template-columns: 50px;">`;

      var gridRow = 1;

      var el = xyz.utils.html.node`
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

        var el = xyz.utils.html.node`<div style="grid-column: 2; font-weight: bold;">Telephone`;
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

        var el = xyz.utils.html.node`<div style="grid-column: 3; font-weight: bold;">Face-to-face`;
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
          var el = xyz.utils.html.node`
              <div style="grid-column: 1; font-weight: bold;">${day}`;
          el.style.gridRow = gridRow;
          viewGrid.appendChild(el);

          if (hours) {
            var el = xyz.utils.html.node`
                <div style="grid-column: 3;">${hours}`;
            el.style.gridRow = gridRow;
            viewGrid.appendChild(el);
          }

          if (phone) {
            var el = xyz.utils.html.node`
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
        var el = xyz.utils.html.node`
            <div style="grid-column: 1/4; white-space: pre-wrap;">${fields.phone_notes}`;
        el.style.gridRow = gridRow;
        viewGrid.appendChild(el);
        gridRow++;
      }

      if (fields.hours_notes) {
        var el = xyz.utils.html.node`
            <div style="grid-column: 1/4; white-space: pre-wrap;">${fields.hours_notes}`;
        el.style.gridRow = gridRow;
        viewGrid.appendChild(el);
        gridRow++;
      }

      location.view.appendChild(viewGrid);

      var viewGrid = xyz.utils.html.node`<div class="grid _grid" style="grid-template-columns: 20px">`;

      viewGrid.appendChild(xyz.utils.html.node`<div style="grid-column: 1/5; grid-row: 1; font-weight: bold; line-height: 2; font-size: 14px;">Services offered:`)

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 2; background-image: url(https://geolytix.github.io/gla/icons/' + (fields.service_initial_advice ? 'checked' : 'unchecked') + '.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 2;">One-off initial advice.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 3; background-image: url(https://geolytix.github.io/gla/icons/' + (fields.service_written_advice ? 'checked' : 'unchecked') + '.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 3;">Written advice.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 4; background-image: url(https://geolytix.github.io/gla/icons/' + (fields.service_form_filling ? 'checked' : 'unchecked') + '.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 4;">Help with filling in forms.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 5; background-image: url(https://geolytix.github.io/gla/icons/' + (fields.service_case_work ? 'checked' : 'unchecked') + '.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 5;">Help with putting a case together for court.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 6; background-image: url(https://geolytix.github.io/gla/icons/' + (fields.service_representation ? 'checked' : 'unchecked') + '.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 6;">Representation at court.`);

      location.view.appendChild(viewGrid);

      var viewGrid = xyz.utils.html.node`<div class="grid _grid" style="grid-template-columns: 30px 1fr 30px 1fr;">`;

      if (fields.translation_notes) {
        viewGrid.appendChild(xyz.utils.html.node`
          <div style="grid-column: 1; grid-row: 1; background-image: url(https://geolytix.github.io/gla/icons/access.svg); height: 25px; background-size: contain; background-repeat: no-repeat;"></div>`);
        viewGrid.appendChild(xyz.utils.html.node`
          <div style="grid-column: 2; grid-row: 1;">
            <div style="font-weight: bold">Access</div>
            <div style="white-space: pre-wrap;">${fields.access}</div>`);
      }

      if (fields.access) {
        viewGrid.appendChild(xyz.utils.html.node`
          <div style="grid-column: 3; grid-row: 1; background-image: url(https://geolytix.github.io/gla/icons/translate.svg); height: 25px; background-size: contain; background-repeat: no-repeat;"></div>`);
        viewGrid.appendChild(xyz.utils.html.node`
          <div style="grid-column: 4; grid-row: 1;">
            <div style="font-weight: bold">Translation</div>
            <div style="white-space: pre-wrap;">${fields.translation_notes}</div>`);
      }

      location.view.appendChild(viewGrid);

      xyz.locations.listview.node.insertBefore(location.view, xyz.locations.listview.node.firstChild);

      locations.closest('.tab').style.display = 'block';

      locations.closest('.tab').click();

      if (window.pageYOffset <= 200) window.scroll({
        top: 200,
        left: 0,
        behavior: 'smooth'
      });

    };

    // Select locations from hooks.
    xyz.hooks.current.locations.forEach(_hook => {

      let hook = _hook.split('!');

      xyz.locations.select({
        locale: xyz.workspace.locale.key,
        layer: xyz.layers.list[decodeURIComponent(hook[0])],
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

}
