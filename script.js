document.addEventListener("DOMContentLoaded", () => {
    // API URL - updated to match the backend controller mappings
    const API_BASE_URL = "http://localhost:8080/api/";
    
    const shadowTableBody = document.getElementById("shadow-table-body");
    const addForm = document.getElementById("add-form");
    const updateForm = document.getElementById("update-form");
    const addSection = document.getElementById("add-shadow-section");
    const updateSection = document.getElementById("update-shadow-section");
    const cancelUpdateButton = document.getElementById("cancel-update");
    const errorMessageDiv = document.getElementById("error-message");

    // --- Error Handling ---
    function showError(message) {
        errorMessageDiv.textContent = `Error: ${message}`;
        errorMessageDiv.style.display = "block";
    }

    function clearError() {
        errorMessageDiv.textContent = "";
        errorMessageDiv.style.display = "none";
    }

    // --- Fetch and Display Shadows ---
    async function fetchShadows() {
        clearError();
        try {
            console.log("Fetching shadows from:", API_BASE_URL);
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const shadows = await response.json();
            console.log("Received shadows:", shadows);
            renderTable(shadows);
        } catch (error) {
            showError(`Cannot load shadows: ${error.message}`);
            console.error("Full error:", error);
            renderTable([]);
        }
    }

    // --- Render Table ---
    function renderTable(shadows) {
        shadowTableBody.innerHTML = "";
        
        if (!shadows || shadows.length === 0) {
            const row = shadowTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4;
            cell.textContent = "No shadows found.";
            cell.style.textAlign = "center";
            return;
        }

        shadows.forEach(shadow => {
            // Add debugging to see what we're getting from the server
            console.log("Processing shadow:", shadow);
            
            // Check if properties exist before accessing them
            const srank = shadow.srank !== undefined ? shadow.srank : 'N/A';
            const name = shadow.name !== undefined ? shadow.name : 'N/A';
            const favFood = shadow.fav_food !== undefined ? shadow.fav_food : 'N/A';
            
            const row = shadowTableBody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(String(srank))}</td>
                <td>${escapeHtml(String(name))}</td>
                <td>${escapeHtml(String(favFood))}</td>
                <td>
                    <button class="action-btn-edit" data-id="${escapeHtml(String(srank))}">Edit</button>
                    <button class="action-btn-delete" data-id="${escapeHtml(String(srank))}">Delete</button>
                </td>
            `;
        });

        addTableButtonListeners();
    }

    // Escape HTML to prevent XSS attacks
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function addTableButtonListeners() {
        document.querySelectorAll(".action-btn-edit").forEach(button => {
            button.addEventListener("click", handleEditClick);
        });
        document.querySelectorAll(".action-btn-delete").forEach(button => {
            button.addEventListener("click", handleDeleteClick);
        });
    }

    // --- Add Shadow ---
    addForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();
        
        const formData = new FormData(addForm);
        const srankValue = formData.get("srank");
        const name = formData.get("name");
        const favFood = formData.get("fav_food");
        
        // Input validation
        if (!srankValue || isNaN(parseInt(srankValue, 10))) {
            showError("Rank must be a valid number");
            return;
        }
        
        if (!name || name.trim() === "") {
            showError("Name cannot be empty");
            return;
        }
        
        if (!favFood || favFood.trim() === "") {
            showError("Favorite food cannot be empty");
            return;
        }
        
        const newShadow = {
            srank: parseInt(srankValue, 10),
            name: name.trim(),
            fav_food: favFood.trim()
        };

        try {
            // POST to the base API URL, not API_URL + id
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newShadow),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            addForm.reset();
            fetchShadows(); // Refresh table
        } catch (error) {
            showError(`Failed to add shadow: ${error.message}`);
        }
    });

    // --- Delete Shadow ---
    async function handleDeleteClick(event) {
        const id = event.target.dataset.id;
        if (!id) {
            showError("Invalid shadow ID");
            return;
        }
        
        if (!confirm(`Are you sure you want to delete shadow with Rank ${id}?`)) {
            return;
        }
        
        clearError();
        try {
            // Updated to match backend DELETE endpoint
            const response = await fetch(`${API_BASE_URL}delete/${id}`, {
                method: "DELETE",
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            fetchShadows(); // Refresh table
        } catch (error) {
            showError(`Failed to delete shadow: ${error.message}`);
        }
    }

    // --- Edit/Update Shadow ---
    async function handleEditClick(event) {
        const id = event.target.dataset.id;
        if (!id) {
            showError("Invalid shadow ID");
            return;
        }
        
        clearError();
        try {
            const response = await fetch(`${API_BASE_URL}${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Shadow with Rank ${id} not found.`);
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            
            const shadow = await response.json();

            // Populate and show update form
            document.getElementById("update-srank").value = shadow.srank;
            document.getElementById("update-srank-display").textContent = shadow.srank;
            document.getElementById("update-name").value = shadow.name;
            document.getElementById("update-fav_food").value = shadow.fav_food;

            addSection.style.display = "none";
            updateSection.style.display = "block";
        } catch (error) {
            showError(`Failed to load shadow for editing: ${error.message}`);
        }
    }

    updateForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();
        
        const formData = new FormData(updateForm);
        const srankValue = formData.get("srank");
        const name = formData.get("name");
        const favFood = formData.get("fav_food");
        
        // Input validation
        if (!srankValue || isNaN(parseInt(srankValue, 10))) {
            showError("Rank must be a valid number");
            return;
        }
        
        if (!name || name.trim() === "") {
            showError("Name cannot be empty");
            return;
        }
        
        if (!favFood || favFood.trim() === "") {
            showError("Favorite food cannot be empty");
            return;
        }
        
        const updatedShadow = {
            srank: parseInt(srankValue, 10),
            name: name.trim(),
            fav_food: favFood.trim()
        };

        try {
            // Updated to match backend PUT endpoint (base URL without ID)
            const response = await fetch(API_BASE_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedShadow),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            // Hide update form, show add form, refresh table
            switchToListView();
            fetchShadows();
        } catch (error) {
            showError(`Failed to update shadow: ${error.message}`);
        }
    });

    cancelUpdateButton.addEventListener("click", switchToListView);

    function switchToListView() {
        updateSection.style.display = "none";
        addSection.style.display = "block";
        updateForm.reset();
        clearError();
    }

    // --- Initial Load ---
    fetchShadows();
});