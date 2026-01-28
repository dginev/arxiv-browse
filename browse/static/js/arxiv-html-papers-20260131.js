// DOM rewrites should be server-side
// TODO: Consider moving this toggle to the header?
// let unwrap_nav = () => {
//     let nav = document.querySelector('.ltx_page_navbar');
//     document.querySelector('#main').prepend(...nav.childNodes);
//     nav.remove();

//     let toc = document.querySelector('.ltx_TOC');
//     if (!toc) { return; }
//     let toc_header = document.createElement('h2');
//     toc_header.innerText = 'Table of Contents';
//     toc_header.id = 'toc_header';
//     toc_header.setAttribute('class', 'sr-only');
//     toc.prepend(toc_header);
//     toc.setAttribute('aria-labelledby', 'toc_header');

//     const olElement = document.querySelector('.ltx_toclist');
//     if (olElement) {
//       const listIconHTML = `
//       <div id="listIcon" type="button" class='hide'>
//           <svg width='17px' height='17px' viewBox="0 0 512 512" style="pointer-events: none;">
//           <path d="M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z"/>
//           </svg>
//       </div>`;

//       const arrowIconHTML = `
//       <div id="arrowIcon" type="button">
//           <svg width='17px' height='17px' viewBox="0 0 448 512" style="pointer-events: none;">
//           <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
//           </svg>
//       </div>`;
//       olElement.insertAdjacentHTML('beforebegin', listIconHTML + arrowIconHTML);
//     }

//     if(window.innerWidth <=719){
//       toc.classList.add('mobile');
//       toc.classList.add('collapse');
//     }
//     else{
//       toc.classList.add('active');
//     }
// }

document.addEventListener("DOMContentLoaded", async () => {
    window.addEventListener('resize', function() {
      if (window.innerWidth <=719) {
        const toc= document.querySelector('.ltx_page_main>.ltx_TOC');
        if (toc) {
          toc.classList.add('mobile');
          toc.classList.add('collapse');
          toc.classList.remove('active');
        }
      }
      else{
        //TOC is shown
        const toc_m = document.querySelector('.ltx_page_main>.ltx_TOC.mobile');
        if (toc_m !== null) {
          toc_m.classList.remove('mobile');
          toc_m.classList.remove('collapse');
          toc_m.classList.remove('show');
          toc_m.classList.add('active');

          //arrow Icon is shown
          const arrowIcon = document.getElementById('arrowIcon');
          arrowIcon.classList.remove('hide');
          //list Icon is hidden
          const listIcon = document.getElementById('listIcon');
          listIcon.classList.add('hide');
          //TOC list is shown
          const toc_list= document.querySelector('.ltx_toclist');
          toc_list.classList.remove('hide');
        }
      }
    });

  //   const referenceItems = document.querySelectorAll(".ltx_bibitem");

  //   referenceItems.forEach(item => {
  //     const referenceId = item.getAttribute("id");
  //     const backToReferenceBtn = document.createElement("button");
  //     backToReferenceBtn.innerHTML = "&#x2191;";
  //     backToReferenceBtn.classList.add("back-to-reference-btn");
  //     backToReferenceBtn.setAttribute("aria-label", "Back to the article");

  //     let scrollPosition = 0;
  //     let clickedCite = false;

  //     backToReferenceBtn.addEventListener("click", function() {
  //       if (clickedCite) {
  //         window.scrollTo(0, scrollPosition);
  //       } else {
  //         let citeElement = document.querySelector(`cite a[href="${window.location.origin}${window.location.pathname}#${referenceId}"]`);
  //         if (citeElement === null) {
  //           citeElement = document.querySelector(`cite a[href="#${referenceId}"]`)
  //         }
  //         if (citeElement) {
  //           citeElement.scrollIntoView({ behavior: "smooth" });
  //         }
  //       }
  //     });

  //     let citeElements = document.querySelectorAll(`cite a[href="${window.location.origin}${window.location.pathname}#${referenceId}"]`);
  //     if (citeElements.length === 0) {
  //       citeElements = document.querySelectorAll(`cite a[href="#${referenceId}"]`);
  //     }
  //     citeElements.forEach(citeElement => {
  //       citeElement.addEventListener("click", function() {
  //         scrollPosition = window.scrollY;
  //         clickedCite = true;
  //       });
  //     });

  //     const refNumElement = item.querySelector(".ltx_tag_bibitem");
  //     if (refNumElement) {
  //       refNumElement.appendChild(backToReferenceBtn);
  //   }
  //   });
  });
  