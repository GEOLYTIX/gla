if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

//move map up on document scroll
document.addEventListener('scroll', () => document.getElementById('Map').style['marginTop'] = -parseInt(window.pageYOffset / 2) + 'px');

const tabs = document.querySelectorAll('.tab');
const locations = document.getElementById('locations');
const layers = document.getElementById('layers');

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
            style="background-image: url('https://cdn.jsdelivr.net/gh/GEOLYTIX/geolytix@master/public/geolytix.svg');">`
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


  if(_xyz.workspace.locale.locate) {

    document.querySelector('.btn-column').appendChild(_xyz.utils.wire()`
    <button title="Current location"
      onclick=${e=>{
        _xyz.mapview.locate.toggle();
        e.target.classList.toggle('enabled');
      }}><div class="xyz-icon icon-gps-not-fixed off-black-filter">`);
  }


  // _xyz.layers.listview.init({
  //   target: layers,
  // });


  const layer = _xyz.layers.list['Advice Center'];


  const table = _xyz.dataview.layerTable({
    layer: layer,
    target_id: 'layers',
    key: 'gla',
    visible: ['organisation_short'],
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

  _xyz.locations.listview.init({
    target: locations,
    callbackInit: () => {
      locations.closest('.tab').style.display = 'none';
      layers.closest('.tab').click();
    },
    callbackAdd: () => {
      locations.closest('.tab').style.display = 'block';
      locations.closest('.tab').click();
    }
  });


  // if (_xyz.workspace.locale.gazetteer) {

  //   const gazetteer = _xyz.utils.wire()`
  //   <div id="gazetteer" class="display-none">
  //     <div class="input-drop">
  //         <input type="text" placeholder="e.g. London">
  //         <ul>`;

  //   const btnGazetteer = _xyz.utils.wire()`
  //   <button onclick=${e=>{
  //     e.preventDefault();
  //     e.target.classList.toggle('enabled');
  //     gazetteer.classList.toggle('display-none');
  //   }}><div class="xyz-icon icon-search">`;

  //   document.querySelector('.btn-column').insertBefore(btnGazetteer,document.querySelector('.btn-column').firstChild);

  //   document.body.insertBefore(gazetteer, document.querySelector('.btn-column'));

  //   _xyz.gazetteer.init({
  //     group: gazetteer.querySelector('.input-drop'),
  //   });
  // }


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

  if (_xyz.log) console.log(_xyz);
}
