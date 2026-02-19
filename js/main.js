// Global Variables
let currentUser = null;
let templates = JSON.parse(localStorage.getItem('templates')) || [];

// Admin Credentials
const ADMIN_USERNAME = 'user';
const ADMIN_PASSWORD = '#selaluamanah';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Check current page
    const path = window.location.pathname;
    
    if (path.includes('login.html')) {
        initLogin();
    } else if (path.includes('dashboard.html')) {
        checkAuth();
        initDashboard();
    } else if (path.includes('create.html')) {
        checkAuth();
        initCreate();
    } else if (path.includes('generate.html')) {
        initGenerate();
    }
});

// Login Page Functions
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Set session
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminName', username);
                
                // Show success message
                showAlert('Login berhasil! Mengalihkan...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showAlert('Username atau password salah!', 'error');
            }
        });
    }
}

// Check Authentication
function checkAuth() {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
        window.location.href = 'login.html';
    }
}

// Dashboard Functions
function initDashboard() {
    loadTemplates();
    updateStats();
}

function loadTemplates() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;
    
    if (templates.length === 0) {
        templateList.innerHTML = '<p class="empty-message">Belum ada template. <a href="create.html">Buat template baru</a></p>';
        return;
    }
    
    let html = '<div class="template-grid">';
    templates.forEach((template, index) => {
        html += `
            <div class="template-card" data-id="${index}">
                <img src="${template.image}" alt="${template.name}" class="template-preview-img">
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>Dibuat: ${template.date}</p>
                    <div class="template-actions">
                        <button onclick="copyTemplateLink('${template.id}')" class="btn btn-small">Copy Link</button>
                        <button onclick="deleteTemplate(${index})" class="btn btn-small btn-danger">Hapus</button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    templateList.innerHTML = html;
}

function updateStats() {
    const totalTemplates = document.getElementById('totalTemplates');
    if (totalTemplates) {
        totalTemplates.textContent = templates.length;
    }
}

// Create Page Functions
function initCreate() {
    const createForm = document.getElementById('createForm');
    const fileInput = document.getElementById('templateFile');
    const templatePreview = document.getElementById('templatePreview');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const shareLink = document.getElementById('shareLink');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.type !== 'image/png') {
                    showAlert('Harap upload file PNG!', 'error');
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    templatePreview.src = event.target.result;
                    templatePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const templateName = document.getElementById('templateName').value;
            const file = fileInput.files[0];
            
            if (!templateName || !file) {
                showAlert('Harap isi semua field!', 'error');
                return;
            }
            
            // Create template object
            const reader = new FileReader();
            reader.onload = function(event) {
                const template = {
                    id: 'twibbon_' + Date.now(),
                    name: templateName,
                    image: event.target.result,
                    date: new Date().toLocaleDateString('id-ID'),
                    link: window.location.origin + '/generate.html?id=' + Date.now()
                };
                
                // Save to localStorage
                templates.push(template);
                localStorage.setItem('templates', JSON.stringify(templates));
                
                // Update share link
                if (shareLink) {
                    shareLink.value = template.link;
                }
                
                showAlert('Template berhasil disimpan!', 'success');
                
                // Reset form
                setTimeout(() => {
                    createForm.reset();
                    templatePreview.style.display = 'none';
                }, 2000);
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (copyLinkBtn && shareLink) {
        copyLinkBtn.addEventListener('click', function() {
            shareLink.select();
            document.execCommand('copy');
            
            // Visual feedback
            this.textContent = 'Tercopy!';
            setTimeout(() => {
                this.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Generate Page Functions
function initGenerate() {
    // Get template ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('id');
    
    // Load template
    let currentTemplate = null;
    if (templateId) {
        currentTemplate = templates.find(t => t.link.includes(templateId));
    }
    
    // If no template found, use first template or show message
    if (!currentTemplate && templates.length > 0) {
        currentTemplate = templates[0];
    }
    
    // Display template info
    const templateInfo = document.getElementById('templateInfo');
    if (templateInfo) {
        if (currentTemplate) {
            templateInfo.innerHTML = `<p>Template: <strong>${currentTemplate.name}</strong></p>`;
        } else {
            templateInfo.innerHTML = '<p class="warning">⚠️ Template tidak tersedia</p>';
        }
    }
    
    // Canvas setup
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    let userPhoto = null;
    let scale = 100;
    let offsetX = 0;
    let offsetY = 0;
    
    // Load twibbon template
    if (currentTemplate) {
        const twibbonImg = new Image();
        twibbonImg.src = currentTemplate.image;
        twibbonImg.onload = () => {
            drawCanvas();
        };
    }
    
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw user photo
        if (userPhoto) {
            const photoWidth = userPhoto.width * (scale / 100);
            const photoHeight = userPhoto.height * (scale / 100);
            const x = (canvas.width - photoWidth) / 2 + offsetX;
            const y = (canvas.height - photoHeight) / 2 + offsetY;
            
            ctx.drawImage(userPhoto, x, y, photoWidth, photoHeight);
        }
        
        // Draw twibbon template
        if (currentTemplate) {
            const twibbonImg = new Image();
            twibbonImg.src = currentTemplate.image;
            twibbonImg.onload = () => {
                ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height);
            };
        }
    }
    
    // Photo upload
    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    userPhoto = new Image();
                    userPhoto.src = event.target.result;
                    userPhoto.onload = () => {
                        drawCanvas();
                    };
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Sliders
    const scaleSlider = document.getElementById('scaleSlider');
    const xSlider = document.getElementById('xSlider');
    const ySlider = document.getElementById('ySlider');
    
    if (scaleSlider) {
        scaleSlider.addEventListener('input', function(e) {
            scale = parseInt(e.target.value);
            document.getElementById('scaleValue').textContent = scale + '%';
            drawCanvas();
        });
    }
    
    if (xSlider) {
        xSlider.addEventListener('input', function(e) {
            offsetX = parseInt(e.target.value);
            document.getElementById('xValue').textContent = offsetX;
            drawCanvas();
        });
    }
    
    if (ySlider) {
        ySlider.addEventListener('input', function(e) {
            offsetY = parseInt(e.target.value);
            document.getElementById('yValue').textContent = offsetY;
            drawCanvas();
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            scale = 100;
            offsetX = 0;
            offsetY = 0;
            
            scaleSlider.value = 100;
            xSlider.value = 0;
            ySlider.value = 0;
            
            document.getElementById('scaleValue').textContent = '100%';
            document.getElementById('xValue').textContent = '0';
            document.getElementById('yValue').textContent = '0';
            
            drawCanvas();
        });
    }
    
    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!userPhoto) {
                showAlert('Silahkan upload foto terlebih dahulu!', 'warning');
                return;
            }
            
            if (!currentTemplate) {
                showAlert('Template tidak tersedia!', 'error');
                return;
            }
            
            const link = document.createElement('a');
            link.download = 'twibbon_' + Date.now() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            showAlert('Download berhasil!', 'success');
        });
    }
    
    // Share link
    const shareLink = document.getElementById('shareLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    
    if (shareLink) {
        shareLink.value = window.location.href;
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            shareLink.select();
            document.execCommand('copy');
            
            this.textContent = 'Tercopy!';
            setTimeout(() => {
                this.textContent = 'Copy Link';
            }, 2000);
        });
    }
    
    // Touch events for mobile
    let touchStartX, touchStartY;
    
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        offsetX += deltaX;
        offsetY += deltaY;
        
        xSlider.value = offsetX;
        ySlider.value = offsetY;
        document.getElementById('xValue').textContent = offsetX;
        document.getElementById('yValue').textContent = offsetY;
        
        drawCanvas();
        
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    });
}

// Helper Functions
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function copyTemplateLink(templateId) {
    const link = window.location.origin + '/generate.html?id=' + templateId;
    
    // Create temporary input
    const input = document.createElement('input');
    input.value = link;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    
    showAlert('Link template berhasil dicopy!', 'success');
}

function deleteTemplate(index) {
    if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
        templates.splice(index, 1);
        localStorage.setItem('templates', JSON.stringify(templates));
        loadTemplates();
        updateStats();
        showAlert('Template berhasil dihapus!', 'success');
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminName');
    window.location.href = 'index.html';
}

// Security: Prevent right click on admin pages
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('create.html')) {
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Prevent inspect element shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            showAlert('Fitur ini tidak tersedia untuk keamanan.', 'warning');
        }
    });
}