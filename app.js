let camera, scene, renderer, controls;
let objects = [];
let targets = { table: [], sphere: [], helix: [], grid: [] };

function handleCredentialResponse(response) {
    document.getElementById('login-wrapper').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    loadSheetDataAndInit();
}

function loadSheetDataAndInit() {
    // ⚠️ REPLACE WITH YOUR ACTUAL GOOGLE SHEET ID
    const SHEET_ID = '1cFukEBtRAzL7DDqQcTzymqoWwdzjH206m_36lK6-eJ0';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            console.log("Parsed CSV Rows:", results.data);
            const rawData = results.data.filter(row => row.Name && row.Name.trim() !== '');
            init3DApp(rawData);
        },
        error: function(err) {
            console.error("CSV Fetch Error:", err);
        }
    });
}

function init3DApp(data) {
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();

    // --- Build 3D Elements ---
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const netWorthKey = Object.keys(item).find(k => k.trim() === 'Net Worth') || 'Net Worth';
        const netWorthStr = item[netWorthKey] || '$0';
        const cleanNetWorth = parseFloat(netWorthStr.replace(/[\$,]/g, '')) || 0;

        // Color coding (Red < $100K, Orange > $100K, Green > $200K)
        let colorClass = 'bg-red';
        if (cleanNetWorth > 200000) {
            colorClass = 'bg-green';
        } else if (cleanNetWorth > 100000) {
            colorClass = 'bg-orange';
        }

        const element = document.createElement('div');
        element.className = `element-card ${colorClass}`;
        element.innerHTML = `
            <div class="index">${i + 1}</div>
            <div class="photo-container">
                <img src="${item.Photo}" alt="${item.Name}" onerror="this.src='https://via.placeholder.com/50'">
            </div>
            <div class="name">${item.Name}</div>
            <div class="details">
                ${item.Country} | Age: ${item.Age}<br>
                ${item.Interest}
            </div>
        `;

        // 🖱️ Add Click Interaction
        element.addEventListener('click', (event) => {
            event.stopPropagation();
            showTileDetails(item, objectCSS);
        });

        const objectCSS = new THREE.CSS3DObject(element);
        objectCSS.position.x = Math.random() * 4000 - 2000;
        objectCSS.position.y = Math.random() * 4000 - 2000;
        objectCSS.position.z = Math.random() * 4000 - 2000;
        scene.add(objectCSS);
        objects.push(objectCSS);
    }

    // --- 1. TABLE LAYOUT (20 x 10) ---
    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();
        object.position.x = ((i % 20) * 140) - 1330;
        object.position.y = (-(Math.floor(i / 20)) * 180) + 800;
        object.position.z = 0;
        targets.table.push(object);
    }

    // --- 2. SPHERE LAYOUT ---
    const vector = new THREE.Vector3();
    for (let i = 0; i < objects.length; i++) {
        const phi = Math.acos(-1 + (2 * i) / objects.length);
        const theta = Math.sqrt(objects.length * Math.PI) * phi;
        const object = new THREE.Object3D();
        object.position.setFromSphericalCoords(800, phi, theta);
        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);
        targets.sphere.push(object);
    }

    // --- 3. DOUBLE HELIX LAYOUT ---
    for (let i = 0; i < objects.length; i++) {
        const strand = i % 2;
        const theta = (i * 0.175) + (strand * Math.PI);
        const y = -(i * 7) + 600;
        const object = new THREE.Object3D();
        object.position.x = 900 * Math.sin(theta);
        object.position.y = y;
        object.position.z = 900 * Math.cos(theta);
        vector.set(object.position.x * 2, object.position.y, object.position.z * 2);
        object.lookAt(vector);
        targets.helix.push(object);
    }

    // --- 4. GRID LAYOUT (5 x 4 x 10) ---
    for (let i = 0; i < objects.length; i++) {
        const object = new THREE.Object3D();
        const x = i % 5;
        const y = Math.floor(i / 5) % 4;
        const z = Math.floor(i / 20);

        object.position.x = (x * 300) - 600;
        object.position.y = -(y * 250) + 375;
        object.position.z = (z * 300) - 1350;
        targets.grid.push(object);
    }

    // --- Render Setup ---
    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('app-container').appendChild(renderer.domElement);

    transform(targets.table, 2000);

    // --- Add TrackballControls for Orbit & Zoom ---
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 6000;
    controls.addEventListener('change', () => renderer.render(scene, camera));
    
    // Event Listeners
    document.getElementById('table').addEventListener('click', () => transform(targets.table, 2000));
    document.getElementById('sphere').addEventListener('click', () => transform(targets.sphere, 2000));
    document.getElementById('helix').addEventListener('click', () => transform(targets.helix, 2000));
    document.getElementById('grid').addEventListener('click', () => transform(targets.grid, 2000));

    window.addEventListener('resize', onWindowResize);
    animate();
}

function transform(target, duration) {
    TWEEN.removeAll();
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const targetObj = target[i];

        new TWEEN.Tween(object.position)
            .to({ x: targetObj.position.x, y: targetObj.position.y, z: targetObj.position.z }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();

        new TWEEN.Tween(object.rotation)
            .to({ x: targetObj.rotation.x, y: targetObj.rotation.y, z: targetObj.rotation.z }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }

    new TWEEN.Tween(this)
        .to({}, duration * 2)
        .onUpdate(() => renderer.render(scene, camera))
        .start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize(); // Update trackball controls on resize
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    if (controls) controls.update();
    renderer.render(scene, camera);
}

// --- Modal & Focus Interaction ---
function showTileDetails(item, objectCSS) {
    // Populate modal data
    document.getElementById('modal-photo').src = item.Photo;
    document.getElementById('modal-name').textContent = item.Name;
    
    const netWorthKey = Object.keys(item).find(k => k.trim() === 'Net Worth') || 'Net Worth';
    document.getElementById('modal-details').innerHTML = `
        <strong>Country:</strong> ${item.Country}<br>
        <strong>Age:</strong> ${item.Age}<br>
        <strong>Interest:</strong> ${item.Interest}<br>
        <strong>Net Worth:</strong> ${item[netWorthKey]}
    `;

    document.getElementById('detail-modal').style.display = 'flex';

    // Smoothly focus camera/tween toward the clicked object
    new TWEEN.Tween(camera.position)
        .to({
            x: objectCSS.position.x,
            y: objectCSS.position.y,
            z: objectCSS.position.z + 400
        }, 1500)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
}

// --- Updated Close Modal Event Listener ---
document.getElementById('modal-close').addEventListener('click', () => {
    // Hide modal
    document.getElementById('detail-modal').style.display = 'none';

    // Smoothly zoom camera back out to the default view
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 0, z: 3000 }, 1500)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
});

document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') {
        document.getElementById('modal-close').click();
    }
});

