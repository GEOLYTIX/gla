window.onload = () => _xyz({
  host: '/gla',
  hooks: true,
  locale: 'London',
  callback: xyz => {

    xyz.mapview.create({
      target: document.getElementById('Map'),
      scrollWheelZoom: true,
      zoomControl: true,
    });

    document.getElementById('btnLocate').onclick = e => {
      xyz.mapview.locate.toggle();
      e.target.classList.toggle('active');
    };

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

    xyz.locations.selectCallback = location => {

      for (const filter of filters) {
        filter.classList.remove('expanded');
      }

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

      location.view = xyz.utils.html.node`<div class="location" style="${'font-size: 14px; margin-top: 10px; border: 3px solid ' + location.record.color}">`;
  
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

        var el = xyz.utils.html.node`
          <div style="grid-column: 2; font-weight: bold;">Telephone`;
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

        var el = xyz.utils.html.node`
          <div style="grid-column: 3; font-weight: bold;">Face-to-face`;
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
      <div style="${'grid-column: 1; grid-row: 2; background-image: url(https://geolytix.github.io/gla/icons/'+ (fields.service_initial_advice ? 'checked' : 'unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 2;">One-off initial advice.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 3; background-image: url(https://geolytix.github.io/gla/icons/'+ (fields.service_written_advice ? 'checked' : 'unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 3;">Written advice.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 4; background-image: url(https://geolytix.github.io/gla/icons/'+ (fields.service_form_filling ? 'checked' : 'unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 4;">Help with filling in forms.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 5; background-image: url(https://geolytix.github.io/gla/icons/'+ (fields.service_case_work ? 'checked' : 'unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="grid-column: 2; grid-row: 5;">Help with putting a case together for court.`);

      viewGrid.appendChild(xyz.utils.html.node`
      <div style="${'grid-column: 1; grid-row: 6; background-image: url(https://geolytix.github.io/gla/icons/'+ (fields.service_representation ? 'checked' : 'unchecked') +'.svg); height: 12px; background-size: contain; background-repeat: no-repeat;'}">`);

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

      document.getElementById('locationView').appendChild(location.view);

    };

    xyz.hooks.current.locations.forEach(_hook => {

      let hook = _hook.split('!');

      xyz.locations.select({
        locale: xyz.workspace.locale.key,
        layer: xyz.layers.list[decodeURIComponent(hook[0])],
        table: hook[1],
        id: hook[2]
      });
    });

    const layer = xyz.layers.list['Advice Center'];

    const table = xyz.dataviews.create({
      target: document.getElementById('List'),
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

    setBoroughFilter();

    layer.filter.current = { borough: { in: [] } };

    function setBoroughFilter() {

      document.getElementById('filterBorough').innerHTML = '';

      const boroughs = [
        'Barking and Dagenham',
        'Barnet',
        'Bexley',
        'Brent',
        'Bromley',
        'Camden',
        'City of London',
        'Croydon',
        'Ealing',
        'Enfield',
        'Greenwich',
        'Hackney',
        'Hammersmith and Fulham',
        'Haringey',
        'Harrow',
        'Havering',
        'Hillingdon',
        'Hounslow',
        'Islington',
        'Kensington and Chelsea',
        'Kingston upon Thames',
        'Lambeth',
        'Lewisham',
        'Merton',
        'Newham',
        'Redbridge',
        'Richmond-upon-Thames',
        'Southwark',
        'Sutton',
        'Tower Hamlets',
        'Wandsworth',
        'Westminster'
      ];

      boroughs.forEach(borough => {

        document.getElementById('filterBorough').appendChild(xyz.utils.html.node`
        <label class="input-checkbox">
        <input type="checkbox" onchange=${e => {
            e.stopPropagation();

            if (e.target.checked) {

              // Add value to filter array.
              layer.filter.current['borough'].in.push(borough);

            } else {

              // Get index of value in filter array.
              let idx = layer.filter.current['borough']['in'].indexOf(borough);

              // Splice filter array on idx.
              layer.filter.current['borough'].in.splice(idx, 1);
            }

            layer.zoomToExtent({ padding: [100, 100, 100, 100] });
            table.update();

          }}>
        </input><div></div><span>${borough}`);
      });

    }

    setServiceFilter();

    function setServiceFilter() {

      document.getElementById('filterServices').innerHTML = '';

      const services = [
        ['service_initial_advice', 'Initial Advice'],
        ['service_written_advice', 'Written Advice'],
        ['service_form_filling', 'Form Filling'],
        ['service_case_work', 'Casework'],
        ['service_representation', 'Representation']
      ];

      services.forEach(service => {

        document.getElementById('filterServices').appendChild(xyz.utils.html.node`
        <label class="input-checkbox">
        <input type="checkbox" onchange=${e => {
            e.stopPropagation();

            if (e.target.checked) {
              layer.filter.current[service[0]] = {};
              layer.filter.current[service[0]]['boolean'] = true;

            } else {

              delete layer.filter.current[service[0]];
            }

            layer.zoomToExtent({ padding: [100, 100, 100, 100] });
            table.update();
          }}>
        </input><div></div><span>${service[1]}`);
      });

    }

    const filters = document.querySelectorAll('.filter');

    for (const filter of filters) {
      filter.onclick = function () {

        if (this.classList.contains('expanded')) {

          this.classList.remove('expanded');

        } else {

          this.classList.add('expanded');

        }

      };
    }

    document.getElementById('resetFilter').onclick = function () {

      layer.filter.current = { borough: { in: [] } };

      for (const filter of filters) {
        filter.classList.remove('expanded');
      }

      setBoroughFilter();

      setServiceFilter();

      layer.zoomToExtent({ padding: [100, 100, 100, 100] });
      table.update();

    };


    // Locator
    xyz.mapview.locate.icon = {
      url: "https://geolytix.github.io/gla/icons/pin_locate.svg",
      anchor: [0.5, 1],
      scale: 0.5
    }


    // Gazetteer
    const input = document.getElementById('postcode-search');

    const find = document.getElementById('postcode-find');

    input.addEventListener('focus', e => {
      find.classList.remove('darkish');
      find.classList.add('pink-bg');
      e.target.parentNode.classList.add('pink-br');
    });

    input.addEventListener('blur', e => {
      find.classList.add('darkish');
      find.classList.remove('pink-bg');
      e.target.parentNode.classList.remove('pink-br');
    });

    xyz.gazetteer.icon = {
      url: "https://geolytix.github.io/gla/icon-pin_gazetteer.svg",
      anchor: [0.5, 1],
      scale: 0.5
    }

    find.addEventListener('click', () => {

      xyz.gazetteer.search(input.value,
        {
          source: 'GOOGLE',
          callback: json => {

            if (json.length === 0) return alert('No results for this search.');

            // Zoom to extent of nearest 3 centre in callback.
            xyz.gazetteer.select(Object.assign(json[0], {callback: res => {

              const xhr = new XMLHttpRequest();

              xhr.open('GET',
                xyz.host + '/api/query?' +
                xyz.utils.paramString({
                  template: 'get_nnearest',
                  locale: 'London',
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

            }}));

          }
        }
      );
    });

  }
});
