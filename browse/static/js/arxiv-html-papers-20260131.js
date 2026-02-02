// similar to `initializeColorScheme`, but also updates the toggle button icons,
// as the DOM is already loaded when this is called.
function activateColorScheme() {
    let theme;
    let current_theme = localStorage.getItem("ar5iv_theme") || "automatic";
    let colorSchemeToggle = document.querySelector('.color-tog');
    let autoIcon = document.querySelectorAll('.automatic-tog');
    let lightIcon = document.querySelectorAll('.light-tog');
    let darkIcon = document.querySelectorAll('.dark-tog');

    if (current_theme === "automatic") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            theme = "dark";
        } else {
            theme = "light";
        }
        colorSchemeToggle.setAttribute('aria-label', 'System preference')
        autoIcon.forEach(x => x.style.display = 'block');
        lightIcon.forEach(x => x.style.display = 'none');
        darkIcon.forEach(x => x.style.display = 'none');
    } else if (current_theme === "light") {
        colorSchemeToggle.setAttribute('aria-label', 'Light mode')
        autoIcon.forEach(x => x.style.display = 'none');
        lightIcon.forEach(x => x.style.display = 'block');
        darkIcon.forEach(x => x.style.display = 'none');
        theme = "light";
    } else {
        colorSchemeToggle.setAttribute('aria-label', 'Dark mode')
        autoIcon.forEach(x => x.style.display = 'none');
        lightIcon.forEach(x => x.style.display = 'none');
        darkIcon.forEach(x => x.style.display = 'block');
        theme = "dark";
    }

    if (theme == "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
    }
}

function toggleColorScheme() {
    var current_theme = localStorage.getItem("ar5iv_theme");
    if (current_theme) {
        if (current_theme == "light") {
            localStorage.setItem("ar5iv_theme", "dark");
        } else if (current_theme == "dark") {
            localStorage.setItem("ar5iv_theme", "automatic");
        } else {
            localStorage.setItem("ar5iv_theme", "light");
        }
    } else {
        localStorage.setItem("ar5iv_theme", "light");
    }
    activateColorScheme();
}

function toggleNavTOC() {
    const toc = document.querySelectorAll('.ltx_page_navbar>nav.ltx_TOC');
    if (toc.length > 0) {
        const style = window.getComputedStyle(toc[0]);
        toc[0].style.display = (style.display === 'none') ? 'block' : 'none';
    }
}


function showModal(modal) {
    modal.style.display = 'block';
    modal.setAttribute('tabindex', '-1'); // Ensure the modal is focusable
    modal.focus();
}

function hideModal(modal) {
    modal.style.display = 'none';
}

// Code for handling key press to open/close modal
const handleKeyDown = (e, modal) => {
    const ctrlOrMeta = e.metaKey || e.ctrlKey;
    if (ctrlOrMeta && (e.key === '/' || e.key === '?')) {
        showModal(modal)
    } else if (ctrlOrMeta && (e.key === '}' || e.key === ']')) {
        hideModal(modal);
    }
}

//submit to the backend, next step: finish
function submitBugReport(e) {
    e.preventDefault();
    //document.getElementById('notification').style = 'display: block';
    const issueData = {};

    // Canonical URL
    ARXIV_ABS_PATH = 'https://arxiv.org/abs/';
    const arxivIdv = window.location.pathname.split('/')[2]; // pathname ex: '/html/2306.16433v1/2306.16433v1.html'
    const fullUrl = window.location.href;
    const canonicalURL = ARXIV_ABS_PATH + arxivIdv;

    // const user_info = "account:yc2455 contact:@cornll.edu "

    // Report Time
    const currentTime = Date.now();

    // Browser Version
    const userAgent = navigator.userAgent;
    const browser = userAgent.match(/(firefox|edge|opr|chrome|safari)[\/]([\d.]+)/i)
    const browserName = browser[1];
    const browserVersion = browser[2];
    const browserInfo = browserName + '/' + browserVersion;

    // Relevant Selection
    let elementIdentifier = bugReportState.getElementIdentifier();
    let topLayer = 'Unknown';
    console.log(currentAnchorNode);
    if (currentAnchorNode !== null) {
        const parentNode = currentAnchorNode.parentNode;
        const id = parentNode.id;
        const classList = parentNode.classList;
        //if there is no id, than use class to identify
        elementIdentifier = id || classList[0] || 'Unknown';
        console.log(elementIdentifier);

        //get the topLayer of id
        if (elementIdentifier.match(/^S\d/)) {
            topLayer = id ? id.split('.')[1] : classList[0];
        } else {
            topLayer = id ? id.split('.')[0] : classList[0];
        }
    }

    const dataDescription = document.getElementById('description').value;
    const formTitle = document.getElementById('form_title').value;

    const uniqueId = window.crypto.randomUUID();

    // add to the form data
    // issueData['template'] = 'bug_report.md'); // TODO: Change this to a template with fields matching the ones below
    issueData['uniqueId'] = uniqueId;
    issueData['canonicalURL'] = canonicalURL;
    issueData['conversionURL'] = window.location.origin + window.location.pathname;
    issueData['reportTime'] = currentTime;
    issueData['browserInfo'] = browserInfo;
    issueData['description'] = dataDescription;
    issueData['locationLow'] = elementIdentifier;
    issueData['locationHigh'] = topLayer;
    issueData['selectedHtml'] = bugReportState.getSelectedHtml();
    issueData['initiationWay'] = bugReportState.getInitiateWay();

    form = new FormData();
    form.append('template', 'bug_report.md');
    form.append('title', `Improve article : ${arxivIdv}`)
    form.append('body', makeGithubBody(issueData));

    // Send to Database.
    postToDB(issueData);

    // Send to Github Issue. !!!NEED: make sure submitter id is same as the html submit button id.
    if (e.submitter.id === 'modal-submit') {
        const GITHUB_BASE_URL = 'https://github.com/arXiv/html_feedback/issues/new?'
        const queryString = new URLSearchParams(form).toString()
        const link = GITHUB_BASE_URL + queryString;
        // window.open(link, '_blank');
        // disable, test later.

        //Testing
        const url = testForGitHubIssue(issueData, arxivIdv, formTitle, fullUrl);
        window.open(url, '_blank');
    } 

    document.querySelector('#modalFormContent').reset();
    bugReportState.clear();
    hideModal(document.getElementById('modalForm'));
}

function handleClickOutsideModal(e, modal) {
    if (e.target == modal)
        modal.style.display = 'none';
}

function handleClickTOCToggle(e) {
    const listIcon= document.getElementById('listIcon');
    const arrowIcon= document.getElementById('arrowIcon');
    const toc = document.querySelector('.ltx_toclist');
    const toc_main = document.querySelector('.ltx_page_main>.ltx_TOC');
    // const content=document.querySelector('.ltx_page_content');
    if (e.target == listIcon) {
        //show toc and arrowIcon
        toc.classList.remove('hide');
        // toc.classList.add('show');
        arrowIcon.classList.remove('hide');
        // arrowIcon.classList.add('show');
        listIcon.classList.add('hide');
        toc_main.classList.add('active')
        // listIcon.classList.remove('show');
        // toc_main.style.backgroundColor = 'var(--background-color)';
        //change 
        /*toc_main.style.flex='1';
        content.style.flex='5';*/
        // toc_main.style.flex = '1 0 20%';  // This means it will start with 20% of the parent width but won't grow or shrink.
        // content.style.flex = '1 1 80%';  // This will make it take the remaining 80% but allows it to adjust as needed.
    }
    if (e.target == arrowIcon) {
        //hide toc and arrowIcon
        toc.classList.add('hide');
        // toc.classList.remove('show');
        arrowIcon.classList.add('hide');
        // arrowIcon.classList.remove('show');
        listIcon.classList.remove('hide');
        toc_main.classList.remove('active');
        // listIcon.classList.add('show');
        // toc_main.style.backgroundColor = 'transparent';
        // toc_main.style.flex='0 0 3rem';
        // content.style.flex='1 1 100%';
    }
}

function postToDB(issueData) {
    const DB_BACKEND_URL = 'https://services.arxiv.org/latexml/feedback';
    const queryString = new URLSearchParams(issueData).toString();
    fetch(DB_BACKEND_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString, // body data type must match "Content-Type" header
    });
}

function makeGithubBody(issueData) {
    let body = "## Describe the issue\n\n";
    body += `**Description**: ${issueData.description}\n\n`;
    body += "Feel free to attach a screenshot (or document) link below: \n\n\n\n";
    // Auto Fill Data
    body += "## Auto Fill Data - !!! Please do not edit below this line !!!\n";
    body += "----------------------------------------------------------------------------------------\n\n";
    body += `Id: ${issueData.uniqueId}\n`
    return body;
}

function testForGitHubIssue(issueData, arxivIdv, formTitle, fullUrl){
    var url = `https://github.com/arXiv/html_feedback/issues/new?assignees=&labels=&projects=&title= ${formTitle}&template=Feedback_about_HTML_formatted_papers.yml`;
    url += `&description=${issueData.description}`;
    url += `&uniqueId=${issueData.uniqueId}`;
    url += `&arxivId=${arxivIdv}`;
    url += `&browserInfo=${issueData.browserInfo}`;
    // send the full url to the github issue
    url += `&fullUrl=${fullUrl}`;
    // device type
    url += `&deviceType=${getDeviceType()}`;
    // https://browse.arxiv.org/latexml/2308.06262v1/2308.06262v1.html

    return url;
}

// test device type
function getDeviceType() {
    const userAgent = navigator.userAgent;

    if (/iPad|iPadOS/i.test(userAgent)) {
        return 'iPad';
    }
    if (/iP(hone|od)/i.test(userAgent)) {
        return 'iOS';
    }
    if (/Android/i.test(userAgent)) {
        return 'Android';
    }
    if (/BlackBerry|IEMobile|Windows Phone/i.test(userAgent)) {
        return 'Other Smartphone';
    }

    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/i.test(userAgent)) {
        return 'Smartphone';
    }
    if (/tablet|tab/i.test(userAgent) && !/Mobile/i.test(userAgent)) {
        return 'Tablet';
    }
    return 'Desktop';
}




function handleClickMobileTOC(e){
    const tocItems = document.querySelectorAll('.ltx_ref');
    const toc = document.querySelector('.ltx_page_main >.ltx_TOC.mobile')
    // //const toggle=document.getElementById('navbar-mobile-toggler')
    // const toggle=document.querySelector('.navbar-toggler-icon');

    // if(e.target==toggle){
    //     if(toc.classList.contains('show')){
    //         //toc.setAttribute('display','none');
    //         //toc.style.setProperty('display','none','important');
    //         toc.classList.add('hide');
    //         toc.classList.remove('show');
    //     }
    //     else{
    //         //toc.setAttribute('display','block');
    //         //toc.style.setProperty('display','block','important');
    //         toc.classList.remove('hide');
    //         toc.classList.add('show');
    //     }
    // }
    tocItems.forEach(item => {
        item.addEventListener('click', () => {
            toc.classList.remove('show');
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {

    // TODO: Reactivate using template scaffold:
    const is_submission = window.location.pathname.split('/')[2] === 'submission';
    const button = document.getElementById('openForm');
    const modal = document.getElementById('modalForm');
    button.onclick = (e) => {
       currentAnchorNode = null;
       showModal(modal, 'button');
       bugReportState.setInitiateWay("Fixedbutton");
    };
    const closeButton = document.getElementById('modal-close');
    closeButton.onclick = (e) => {
        
        hideModal(modal);
        // selectedTextDescriptionLabel.style.display = 'none';
        // normalDescriptionLabel.style.display = 'block';
    }

    document.onkeydown = (e) => handleKeyDown(e, modal);
    document.onclick = (e) => {
        handleClickOutsideModal(e, modal);
        if(window.innerWidth <= 719){
            handleClickMobileTOC(e);
        }
        else{
            handleClickTOCToggle(e);
        }
    }
    // TODO: Add stable logic to capture the selection when clicking on the singleton "Report issue" button.
    // document.onmouseup = (e) => handleMouseUp(e, smallReportButton);
    // document.ontouchend = (e) => handleMouseUp(e, smallReportButton);

    let lastScrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

    document.getElementById('modalFormContent').onsubmit = submitBugReport;

    activateColorScheme();
    
});