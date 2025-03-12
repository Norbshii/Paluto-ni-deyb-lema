document.addEventListener('DOMContentLoaded', function() {
    // Get all campaign cards
    const campaignCards = document.querySelectorAll('.campaign__card');
    const mainReserveBtn = document.getElementById('mainReserveBtn');
    const visitorModal = document.getElementById('visitorModal');
    const reservationModal = document.getElementById('reservationModal');
    const summaryModal = document.getElementById('summaryModal');
    const confirmationModal = document.getElementById('confirmationModal');
    const campaignSelect = document.getElementById('campaignSelect');
    const dateInput = document.getElementById('reserveDate');
    const dateAlertModal = document.getElementById('dateAlertModal');
    const visitorForm = document.getElementById('visitorForm');
    const reservationForm = document.getElementById('reservationForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    let isLocked = false;
    let visitorInfo = null;
    let lastReservationData = null;

    // Show visitor form on page load if no visitor info exists
    const storedVisitorInfo = sessionStorage.getItem('visitorInfo');
    if (!storedVisitorInfo && visitorModal) {
        visitorModal.style.display = 'block';
        document.body.classList.add('modal-open');
    } else if (storedVisitorInfo) {
        visitorInfo = JSON.parse(storedVisitorInfo);
    }

    // Function to save reservation form data
    function saveReservationData() {
        if (reservationForm) {
            const formData = new FormData(reservationForm);
            lastReservationData = {
                fullName: formData.get('fullName'),
                phoneNumber: formData.get('phoneNumber'),
                inquiryType: formData.get('inquiryType'),
                numberOfPeople: formData.get('numberOfPeople'),
                message: formData.get('message')
            };
            sessionStorage.setItem('lastReservationData', JSON.stringify(lastReservationData));
        }
    }

    // Function to load reservation data
    function loadReservationData() {
        const storedReservationData = sessionStorage.getItem('lastReservationData');
        if (storedReservationData && reservationForm) {
            const data = JSON.parse(storedReservationData);
            const reserveName = document.getElementById('reserveName');
            const reservePhone = document.getElementById('reservePhone');
            const inquiryType = document.getElementById('inquiryType');
            const reservePeople = document.getElementById('reservePeople');
            const reserveMessage = document.getElementById('reserveMessage');

            if (reserveName) reserveName.value = data.fullName || '';
            if (reservePhone) reservePhone.value = data.phoneNumber || '';
            if (inquiryType) inquiryType.value = data.inquiryType || '';
            if (reservePeople) reservePeople.value = data.numberOfPeople || '';
            if (reserveMessage) reserveMessage.value = data.message || '';
        }
    }

    // Add event listener to reservation form for saving data
    if (reservationForm) {
        reservationForm.addEventListener('input', saveReservationData);
    }

    // Function to validate phone number input
    function validatePhoneNumberInput(input) {
        // Remove any non-numeric characters
        let value = input.value.replace(/\D/g, '');
        
        // Ensure it starts with '09'
        if (value.length >= 2 && value.substring(0, 2) !== '09') {
            value = '09' + value.substring(2);
        }
        
        // Limit to 11 digits
        value = value.substring(0, 11);
        
        // Update input value
        input.value = value;
    }

    // Add phone number validation to visitor form
    const visitorPhone = document.getElementById('visitorPhone');
    if (visitorPhone) {
        visitorPhone.addEventListener('input', function() {
            validatePhoneNumberInput(this);
        });

        // Prevent non-numeric key presses
        visitorPhone.addEventListener('keypress', function(e) {
            if (!/^\d*$/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Set initial value to '09' if empty
        if (!visitorPhone.value) {
            visitorPhone.value = '09';
        }
    }

    // Add phone number validation to reservation form
    const reservePhone = document.getElementById('reservePhone');
    if (reservePhone) {
        reservePhone.addEventListener('input', function() {
            validatePhoneNumberInput(this);
        });

        // Prevent non-numeric key presses
        reservePhone.addEventListener('keypress', function(e) {
            if (!/^\d*$/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Set initial value to '09' if empty
        if (!reservePhone.value) {
            reservePhone.value = '09';
        }
    }

    // Function to handle visitor form submission
    if (visitorForm) {
        visitorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            const phoneInput = this.querySelector('input[name="phoneNumber"]');

            // Validate phone number length before submission
            if (phoneInput.value.length !== 11) {
                alert('Please enter a valid 11-digit phone number starting with 09');
                return;
            }

            showLoading(submitButton);
            
            try {
                const formData = new FormData(this);
                visitorInfo = {
                    fullName: formData.get('fullName'),
                    phoneNumber: formData.get('phoneNumber')
                };

                const result = await submitVisitorData(visitorInfo);
                if (result.status === 'error') {
                    alert('Error saving visitor information: ' + result.message);
                    return;
                }

                sessionStorage.setItem('visitorInfo', JSON.stringify(visitorInfo));
                visitorModal.style.display = 'none';
                document.body.classList.remove('modal-open');

                const reserveName = document.getElementById('reserveName');
                const reservePhone = document.getElementById('reservePhone');
                if (reserveName && reservePhone) {
                    reserveName.value = visitorInfo.fullName;
                    reservePhone.value = visitorInfo.phoneNumber;
                }

                if (reservationModal.style.display === 'block') {
                    document.body.classList.add('modal-open');
                }
            } catch (error) {
                alert('Error submitting visitor information. Please try again.');
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    // Function to get tomorrow's date in YYYY-MM-DD format
    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // Function to get the next Friday's date
    function getNextFriday() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start from tomorrow
        
        // Calculate days until next Friday
        let daysUntilFriday = 5 - tomorrow.getDay(); // 5 represents Friday
        if (daysUntilFriday <= 0) {
            daysUntilFriday += 7; // If we've passed Friday, get next week's Friday
        }
        
        const nextFriday = new Date(tomorrow);
        nextFriday.setDate(tomorrow.getDate() + daysUntilFriday);
        return nextFriday.toISOString().split('T')[0];
    }

    // Set minimum date for date input
    if (dateInput) {
        const tomorrow = getTomorrowDate();
        dateInput.min = tomorrow;
        
        // Disable past dates and today
        dateInput.addEventListener('input', function() {
            const selectedDate = new Date(this.value);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            if (selectedDate < tomorrow) {
                showDateAlert('Please select a future date starting from tomorrow.');
                this.value = tomorrow.toISOString().split('T')[0];
            }
        });
    }

    // Function to lock campaign selection
    function lockCampaign() {
        campaignSelect.classList.add('locked');
        campaignSelect.parentElement.classList.add('locked-campaign');
        campaignSelect.disabled = true;
        isLocked = true;
    }

    // Function to unlock campaign selection
    function unlockCampaign() {
        campaignSelect.classList.remove('locked');
        campaignSelect.parentElement.classList.remove('locked-campaign');
        campaignSelect.disabled = false;
        isLocked = false;
    }

    // Function to show date alert modal
    function showDateAlert(message) {
        const dateAlertMessage = document.getElementById('dateAlertMessage');
        if (dateAlertMessage) {
            dateAlertMessage.textContent = message;
        }
        if (dateAlertModal) {
            dateAlertModal.style.display = 'block';
        }
    }

    // Function to validate date for Campaign 1 (Friday only)
    function validateCampaign1Date(date) {
        const selectedDate = new Date(date);
        return selectedDate.getDay() === 5; // 5 represents Friday (0 is Sunday, 1 is Monday, etc.)
    }

    // Add event listener for date input
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const selectedCampaign = campaignSelect.value;
            const selectedDate = this.value;

            if (selectedCampaign === 'Campaign 1' && !validateCampaign1Date(selectedDate)) {
                showDateAlert('Campaign 1 is only available on Fridays. Please select a Friday date.');
                this.value = getNextFriday(); // Set to next Friday instead of clearing
            }
        });
    }

    // Add event listener for campaign select
    if (campaignSelect) {
        campaignSelect.addEventListener('change', function() {
            if (this.value === 'Campaign 1') {
                if (dateInput.value && !validateCampaign1Date(dateInput.value)) {
                    dateInput.value = getNextFriday(); // Set to next Friday
                } else if (!dateInput.value) {
                    dateInput.value = getNextFriday(); // Set to next Friday if no date selected
                }
            }
        });
    }

    // Modify the part where reservation modal is shown to load saved data
    campaignCards.forEach(card => {
        card.addEventListener('click', function() {
            const campaign = this.dataset.campaign;
            
            if (campaignSelect) {
                campaignSelect.value = campaign;
                campaignSelect.dispatchEvent(new Event('change'));
                lockCampaign();
            }
            
            if (reservationModal) {
                reservationModal.style.display = 'block';
                document.body.classList.add('modal-open');

                // Auto-fill visitor info and saved reservation data
                if (visitorInfo) {
                    const reserveName = document.getElementById('reserveName');
                    const reservePhone = document.getElementById('reservePhone');
                    if (reserveName && reservePhone) {
                        reserveName.value = visitorInfo.fullName;
                        reservePhone.value = visitorInfo.phoneNumber;
                    }
                }
                loadReservationData();
            }

            // Set next Friday's date if Campaign 1 is selected
            if (campaign === 'Campaign 1') {
                dateInput.value = getNextFriday();
            } else if (!dateInput.value) {
                dateInput.value = getTomorrowDate();
            }
        });
    });

    // Modify main reserve button click to load saved data
    if (mainReserveBtn) {
        mainReserveBtn.addEventListener('click', function() {
            unlockCampaign();
            if (reservationModal) {
                reservationModal.style.display = 'block';
                document.body.classList.add('modal-open');

                // Auto-fill visitor info and saved reservation data
                if (visitorInfo) {
                    const reserveName = document.getElementById('reserveName');
                    const reservePhone = document.getElementById('reservePhone');
                    if (reserveName && reservePhone) {
                        reserveName.value = visitorInfo.fullName;
                        reservePhone.value = visitorInfo.phoneNumber;
                    }
                }
                loadReservationData();
            }
            if (dateInput && !dateInput.value) {
                dateInput.value = getTomorrowDate();
            }
        });
    }

    // Close modal when clicking the close button or outside the modal
    const closeButtons = document.querySelectorAll('.close-btn, .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                // Reset lock state when closing modal
                if (isLocked) {
                    unlockCampaign();
                }
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Reset lock state when closing modal
            if (isLocked) {
                unlockCampaign();
            }
        }
    });

    // Function to close modals
    window.closeModal = function(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Function to format date for display
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Enhanced loading functions
    function showLoading(button = null) {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            document.body.classList.add('loading');
        }
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }
    }

    function hideLoading(button = null) {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            document.body.classList.remove('loading');
        }
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Function to submit visitor data to Google Sheets
    async function submitVisitorData(visitorData) {
        showLoading();
        try {
            const response = await fetch('/submit_visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitorData)
            });
            const result = await response.json();
            hideLoading();
            return result;
        } catch (error) {
            hideLoading();
            console.error('Error submitting visitor data:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Function to submit reservation data to Google Sheets
    async function submitReservation(reservationData) {
        showLoading();
        try {
            // Ensure campaign is included in the submission
            if (!reservationData.campaign && campaignSelect) {
                reservationData.campaign = campaignSelect.value;
            }

            const response = await fetch('/submit_reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            const result = await response.json();
            hideLoading();
            return result;
        } catch (error) {
            hideLoading();
            console.error('Error submitting reservation:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Update reservation form submission
    if (reservationForm) {
        reservationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            const phoneInput = this.querySelector('input[name="phoneNumber"]');

            // Validate phone number length before submission
            if (phoneInput.value.length !== 11) {
                alert('Please enter a valid 11-digit phone number starting with 09');
                return;
            }

            showLoading(submitButton);
            
            try {
                const formData = new FormData(this);
                const reservationData = {
                    fullName: formData.get('fullName'),
                    phoneNumber: formData.get('phoneNumber'),
                    inquiryType: formData.get('inquiryType'),
                    date: formData.get('date'),
                    time: formData.get('time'),
                    numberOfPeople: formData.get('numberOfPeople'),
                    message: formData.get('message'),
                    campaign: campaignSelect ? campaignSelect.value : 'Basic'
                };

                saveReservationData();

                const summaryContent = document.getElementById('summaryContent');
                if (summaryContent) {
                    summaryContent.innerHTML = `
                        <p><strong>Campaign:</strong> ${reservationData.campaign}</p>
                        <p><strong>Full Name:</strong> ${reservationData.fullName}</p>
                        <p><strong>Contact Number:</strong> ${reservationData.phoneNumber}</p>
                        <p><strong>Type of Inquiry:</strong> ${reservationData.inquiryType}</p>
                        <p><strong>Date:</strong> ${formatDate(reservationData.date)}</p>
                        <p><strong>Time:</strong> ${reservationData.time}</p>
                        <p><strong>Number of People:</strong> ${reservationData.numberOfPeople}</p>
                        ${reservationData.message ? `<p><strong>Special Requests:</strong> ${reservationData.message}</p>` : ''}
                    `;
                }

                reservationModal.style.display = 'none';
                if (summaryModal) {
                    summaryModal.style.display = 'block';
                    document.body.classList.add('modal-open');
                }

                // Handle confirm reservation button
                const confirmButton = document.getElementById('confirmReservation');
                if (confirmButton) {
                    confirmButton.onclick = async function() {
                        showLoading(confirmButton);
                        try {
                            const result = await submitReservation(reservationData);
                            
                            if (result.status === 'error') {
                                alert('Error submitting reservation: ' + result.message);
                                return;
                            }

                            summaryModal.style.display = 'none';
                            
                            const confirmationCode = document.getElementById('reservationCode');
                            if (confirmationCode) {
                                confirmationCode.innerHTML = `
                                    <div class="code-display">
                                        <span class="code">${result.reservationCode}</span>
                                    </div>
                                `;
                            }

                            if (confirmationModal) {
                                confirmationModal.style.display = 'block';
                                document.body.classList.add('modal-open');
                            }
                        } catch (error) {
                            alert('Failed to submit reservation. Please try again.');
                        } finally {
                            hideLoading(confirmButton);
                        }
                    };
                }

                // Handle edit button
                const editButton = document.getElementById('editReservation');
                if (editButton) {
                    editButton.onclick = function() {
                        summaryModal.style.display = 'none';
                        reservationModal.style.display = 'block';
                        document.body.classList.add('modal-open');
                    };
                }
            } finally {
                hideLoading(submitButton);
            }
        });
    }

    // Handle done button in confirmation modal
    const doneButton = document.getElementById('doneButton');
    if (doneButton) {
        doneButton.addEventListener('click', function() {
            confirmationModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Clear the reservation form
            if (reservationForm) {
                reservationForm.reset();
            }
            // Reset campaign selection if it was locked
            if (isLocked) {
                unlockCampaign();
            }
        });
    }

    // Update loading overlay content with animation
    if (loadingOverlay) {
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">Processing your request...</div>
            </div>
        `;
    }
}); 