// Modal elements
const visitorModal = document.getElementById('visitorModal');
const reservationModal = document.getElementById('reservationModal');
const summaryModal = document.getElementById('summaryModal');
const confirmationModal = document.getElementById('confirmationModal');
const dateAlertModal = document.getElementById('dateAlertModal');

// Get the buttons
const reserveBtn = document.querySelector('.header__btn .btn');
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");
const mainReserveBtn = document.getElementById('mainReserveBtn');

// Get forms
const visitorForm = document.getElementById('visitorForm');
const reservationForm = document.getElementById('reservationForm');

// Track if a specific campaign is selected
let selectedCampaign = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const visitorModal = document.getElementById('visitorModal');
    const reservationModal = document.getElementById('reservationModal');
    const summaryModal = document.getElementById('summaryModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const dateAlertModal = document.getElementById('dateAlertModal');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Buttons and form elements
    const mainReserveBtn = document.getElementById('mainReserveBtn');
    const menuBtn = document.getElementById("menu-btn");
    const navLinks = document.getElementById("nav-links");
    const menuBtnIcon = menuBtn?.querySelector("i");
    const closeButtons = document.querySelectorAll('.close-btn');
    const campaignReserveButtons = document.querySelectorAll('.campaign-reserve-btn');
    const campaignSelect = document.getElementById('campaignSelect');
    
    // Forms
    const visitorForm = document.getElementById('visitorForm');
    const reservationForm = document.getElementById('reservationForm');
    const charCount = document.getElementById('charCount');

    // Function to show loading overlay
    function showLoading(message = 'Processing your request...') {
        loadingOverlay.querySelector('.loading-text').textContent = message;
        loadingOverlay.style.display = 'flex';
    }

    // Function to hide loading overlay
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // Function to set button loading state
    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    // Function to open reservation modal
    function openReservationModal(campaign = null) {
        // Reset selected campaign state
        selectedCampaign = campaign;
        
        // If a specific campaign is selected
        if (campaign) {
            // Set the campaign dropdown value
            campaignSelect.value = campaign;
            // Disable the campaign dropdown
            campaignSelect.disabled = true;
            // Add a visual indicator that it's locked
            campaignSelect.classList.add('locked-field');
            
            // Initialize date input with campaign restrictions
            initializeDateInput(campaign);
        } else {
            // Enable the campaign dropdown for normal reservations
            campaignSelect.disabled = false;
            campaignSelect.classList.remove('locked-field');
            
            // Initialize date input for Basic reservation
            initializeDateInput('Basic');
        }
        
        reservationModal.style.display = 'block';
    }

    // Main reservation button click handler - this is for regular/basic reservations
    if (mainReserveBtn) {
        mainReserveBtn.addEventListener('click', function() {
            openReservationModal();
        });
    }
    
    // Campaign-specific reservation buttons
    campaignReserveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const campaign = this.getAttribute('data-campaign');
            openReservationModal(campaign);
        });
    });

    // Modal functions
    function showModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }
    
    function hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            // Only remove modal-open class if no other modals are visible
            const visibleModals = document.querySelectorAll('.modal[style*="display: block"]');
            if (visibleModals.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }
    }

    // Initialize modal close buttons
    const modals = [visitorModal, reservationModal, summaryModal, confirmationModal, dateAlertModal];
    
    // Add close button functionality to each modal
    modals.forEach(modal => {
        if (!modal) return;
        
        const closeBtn = modal.querySelector('.close-btn') || modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = function() {
                hideModal(modal);
            }
        }
    });
    
    // Only allow clicking outside to close for visitor and date alert modals
    window.onclick = function(e) {
        if (e.target === visitorModal) {
            hideModal(visitorModal);
        } else if (e.target === dateAlertModal) {
            hideModal(dateAlertModal);
        }
    }

    // Show visitor modal on page load
    window.addEventListener('load', function() {
        visitorModal.style.display = 'block';
    });

    // Handle visitor form submission
    visitorForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        
        try {
            setButtonLoading(submitButton, true);
            showLoading('Saving visitor information...');
            
            const formData = {
                fullName: document.getElementById('visitorName').value,
                phoneNumber: document.getElementById('visitorPhone').value
            };
            
            console.log('Submitting visitor data:', formData);

            const response = await fetch('/submit_visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Received response:', response);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.status === 'success') {
                console.log('Visitor submission successful');
                visitorModal.style.display = 'none';
                // Pre-fill the reservation form with visitor info
                if (document.getElementById('reserveName')) {
                    document.getElementById('reserveName').value = formData.fullName;
                }
                if (document.getElementById('reservePhone')) {
                    document.getElementById('reservePhone').value = formData.phoneNumber;
                }
            } else {
                console.error('Error from server:', data.message);
                alert('Error submitting visitor information: ' + data.message);
            }
        } catch (error) {
            console.error('Error in visitor submission:', error);
            alert('Error submitting visitor information. Please try again.');
        } finally {
            setButtonLoading(submitButton, false);
            hideLoading();
        }
    });

    // Handle reservation form submission
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedCampaign = this.campaign.value;
        const selectedDate = new Date(this.date.value);
        const tomorrow = getTomorrow();
        tomorrow.setHours(0, 0, 0, 0);
        
        // Validate date is in the future for all campaigns
        if (selectedDate < tomorrow) {
            this.date.value = formatDateForInput(tomorrow);
            showDateAlert('Please select a future date for your reservation. We\'ve automatically selected tomorrow\'s date for you. 📅');
            return; // Don't proceed until user acknowledges the date change
        }
        
        // For Campaign 1, validate that date is a Friday
        if (selectedCampaign === 'Campaign 1' && selectedDate.getDay() !== 5) {
            const nextFriday = getNextFriday();
            this.date.value = formatDateForInput(nextFriday);
            showDateAlert('For our Seafood Friday Special, reservations are only available on Fridays. We\'ve automatically selected the next available Friday for you. 🐟');
            return; // Don't proceed until user acknowledges the date change
        }

        const formData = {
            fullName: this.fullName.value,
            phoneNumber: this.phoneNumber.value,
            inquiryType: this.querySelector('select[name="inquiryType"]').value,
            date: this.date.value,
            time: this.time.value,
            numberOfPeople: this.numberOfPeople.value,
            message: this.message.value,
            campaign: this.campaign.value
        };

        // Show summary modal
        showSummaryModal(formData);
    });

    // Function to show summary modal
    function showSummaryModal(formData) {
        const summaryContent = document.getElementById('summaryContent');
        
        // Get the campaign name from the dropdown
        const campaignSelect = document.getElementById('campaignSelect');
        const selectedCampaignName = campaignSelect.selectedOptions[0].text;
        
        summaryContent.innerHTML = `
            <p><strong>Campaign:</strong> ${selectedCampaignName}</p>
            <p><strong>Name:</strong> ${formData.fullName}</p>
            <p><strong>Phone:</strong> ${formData.phoneNumber}</p>
            <p><strong>Inquiry Type:</strong> ${formData.inquiryType}</p>
            <p><strong>Date:</strong> ${formData.date}</p>
            <p><strong>Time:</strong> ${formData.time}</p>
            <p><strong>Number of People:</strong> ${formData.numberOfPeople}</p>
            <p><strong>Special Requests:</strong> ${formData.message || 'None'}</p>
        `;

        document.getElementById('confirmReservation').dataset.formData = JSON.stringify(formData);
        
        hideModal(reservationModal);
        showModal(summaryModal);
    }

    // Handle edit button click
    document.getElementById('editReservation').addEventListener('click', function() {
        const formData = JSON.parse(document.getElementById('confirmReservation').dataset.formData);
        
        // Populate form with existing data
        const form = document.getElementById('reservationForm');
        form.fullName.value = formData.fullName;
        form.phoneNumber.value = formData.phoneNumber;
        form.inquiryType.value = formData.inquiryType;
        form.date.value = formData.date;
        form.time.value = formData.time;
        form.numberOfPeople.value = formData.numberOfPeople;
        form.message.value = formData.message || '';
        form.campaign.value = formData.campaign;
        
        // Switch modals
        hideModal(summaryModal);
        showModal(reservationModal);
    });

    // Function to show confirmation modal
    function showConfirmationModal(reservationCode) {
        document.getElementById('reservationCode').textContent = reservationCode;
        hideModal(summaryModal);
        showModal(confirmationModal);
    }

    // Function to submit reservation
    async function submitReservation(formData) {
        const response = await fetch('/submit_reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            // Hide summary modal and show confirmation with the code
            hideModal(summaryModal);
            
            // Update and show confirmation modal
            document.getElementById('reservationCode').textContent = data.reservationCode;
            showModal(confirmationModal);
            
            // Add done button functionality
            const doneBtn = document.getElementById('doneButton');
            if (doneBtn) {
                doneBtn.onclick = function() {
                    hideModal(confirmationModal);
                    document.getElementById('reservationForm').reset();
                }
            }
        } else {
            throw new Error(data.message || 'Failed to submit reservation');
        }
    }

    // Handle summary confirmation
    document.getElementById('confirmReservation').addEventListener('click', async function() {
        const formData = JSON.parse(this.dataset.formData);
        const confirmButton = this;
        
        try {
            setButtonLoading(confirmButton, true);
            showLoading('Submitting your reservation...');
            await submitReservation(formData);
        } catch (error) {
            console.error('Error:', error);
            showDateAlert('Error submitting reservation: ' + error.message);
        } finally {
            setButtonLoading(confirmButton, false);
            hideLoading();
        }
    });

    // Date handling functions
    function getTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }

    function getNextFriday() {
        const date = new Date();
        date.setDate(date.getDate() + 1); // Start from tomorrow
        
        // Keep adding days until we reach a Friday (5)
        while (date.getDay() !== 5) {
            date.setDate(date.getDate() + 1);
        }
        return date;
    }

    function getNextValidDate(campaign) {
        if (campaign === 'Campaign 1') {
            return getNextFriday();
        }
        return getTomorrow();
    }

    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isValidDate(date, campaign) {
        const selectedDate = new Date(date);
        const tomorrow = getTomorrow();
        tomorrow.setHours(0, 0, 0, 0); // Reset time for accurate comparison
        
        // Check if date is not in the past
        if (selectedDate < tomorrow) {
            return false;
        }
        
        // For Campaign 1, only allow Fridays
        if (campaign === 'Campaign 1') {
            return selectedDate.getDay() === 5;  // 5 is Friday
        }
        
        return true;
    }

    // Show custom alert modal
    function showDateAlert(message) {
        const modal = document.getElementById('dateAlertModal');
        const messageElement = document.getElementById('dateAlertMessage');
        
        if (modal && messageElement) {
            messageElement.textContent = message;
            modal.style.display = 'block';
            
            // Close when clicking the X button
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.onclick = function() {
                    modal.style.display = 'none';
                }
            }
            
            // Close when clicking the Got it! button
            const gotItButton = modal.querySelector('.btn');
            if (gotItButton) {
                gotItButton.onclick = function() {
                    modal.style.display = 'none';
                }
            }
            
            // Close when clicking outside the modal
            window.onclick = function(event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            }
        }
    }

    // Initialize date input with restrictions
    function initializeDateInput(campaign) {
        const dateInput = document.getElementById('reserveDate');
        if (!dateInput) return;

        // Get next valid date based on campaign
        const nextValidDate = getNextValidDate(campaign);
        const minDate = formatDateForInput(nextValidDate);
        
        // Set minimum date to tomorrow for all campaigns
        const tomorrow = getTomorrow();
        dateInput.min = formatDateForInput(tomorrow);
        
        // For Campaign 1, set to next Friday and show info message
        if (campaign === 'Campaign 1') {
            dateInput.value = minDate; // Next Friday
            showDateAlert('For our Seafood Friday Special, reservations are only available on Fridays. We\'ve automatically selected the next available Friday for you. 🐟');
        } else {
            // For other campaigns, only set value if it's empty or invalid
            if (!dateInput.value || new Date(dateInput.value) < tomorrow) {
                dateInput.value = formatDateForInput(tomorrow);
            }
        }
        
        // Remove any existing input event listeners
        const newDateInput = dateInput.cloneNode(true);
        dateInput.parentNode.replaceChild(newDateInput, dateInput);
        
        // Add campaign-specific event listener to prevent invalid dates
        newDateInput.addEventListener('input', function() {
            if (campaign === 'Campaign 1') {
                // For Campaign 1, validate that date is a Friday
                const selectedDate = new Date(this.value);
                if (selectedDate.getDay() !== 5) { // Not a Friday
                    const nextFriday = getNextFriday();
                    this.value = formatDateForInput(nextFriday);
                    showDateAlert('For our Seafood Friday Special, reservations are only available on Fridays. We\'ve automatically selected the next available Friday for you. 🐟');
                }
            } else {
                // For other campaigns, just ensure it's not in the past
                const selectedDate = new Date(this.value);
                const tomorrow = getTomorrow();
                tomorrow.setHours(0, 0, 0, 0);
                
                if (selectedDate < tomorrow) {
                    this.value = formatDateForInput(tomorrow);
                    showDateAlert('Please select a future date for your reservation. We\'ve automatically selected tomorrow\'s date for you. 📅');
                }
            }
        });
    }

    // Campaign selection handling
    function handleCampaignSelection() {
        const campaignSelect = document.getElementById('campaignSelect');
        const selectedCampaign = campaignSelect.value;
        
        console.log('Selected campaign:', selectedCampaign); // Debug log
        
        // Update date input based on selected campaign
        initializeDateInput(selectedCampaign);
    }

    // Initialize form
    if (campaignSelect) {
        // Add change event listener
        campaignSelect.addEventListener('change', handleCampaignSelection);
        
        // Initialize with current selection
        handleCampaignSelection();
    }

    // Character count for message
    document.getElementById('reserveMessage').addEventListener('input', function() {
        const remaining = this.value.length;
        charCount.textContent = `${remaining}/250`;
    });
});

// Close button functionality
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        hideModal(visitorModal);
        hideModal(reservationModal);
        hideModal(summaryModal);
        hideModal(confirmationModal);
        hideModal(dateAlertModal);
    });
});

// Phone number validation
function validatePhoneNumber(phoneNumber) {
    const regex = /^[0-9+()-\s]*$/;
    return regex.test(phoneNumber);
}

// Prevent non-numeric input for phone
function preventNonNumericInput(event) {
    if (!/[0-9+()-\s]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        event.preventDefault();
    }
}

// Add event listeners to phone inputs
document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('keydown', preventNonNumericInput);
});

// Prevent non-numeric input for number of people
function preventNonNumericInputPeople(event) {
    if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        event.preventDefault();
    }
}

// Add event listener to number of people input
document.getElementById('reservePeople').addEventListener('keydown', preventNonNumericInputPeople);

// Toast notification function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

// Toggle mobile navigation menu
menuBtn.addEventListener('click', function() {
  navLinks.classList.toggle('active');
  // Toggle icon between menu and close
  if (navLinks.classList.contains('active')) {
    menuBtnIcon.classList.remove('ri-menu-line');
    menuBtnIcon.classList.add('ri-close-line');
  } else {
    menuBtnIcon.classList.remove('ri-close-line');
    menuBtnIcon.classList.add('ri-menu-line');
  }
});

// ScrollReveal animations
const scrollRevealOption = {
    distance: "50px",
    origin: "bottom",
    duration: 1000,
};

ScrollReveal().reveal(".header__image img", {
    ...scrollRevealOption,
    origin: "right",
});

ScrollReveal().reveal(".header__content h1", {
    ...scrollRevealOption,
});
