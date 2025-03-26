(function ($) {
  "use strict";
  const $loadingElement = $("#l-loading");

  function isMobileDevice() {
    const userAgent = navigator.userAgent;
    const mobileKeywords = ["iPhone", "iPad", "Android", "Mobile"];
    for (let i = 0; i < mobileKeywords.length; i++) {
      if (userAgent.indexOf(mobileKeywords[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  if (isMobileDevice()) {
    $("html").addClass("is-mobile");
  }

  function scrollAnimation() {
    inView.offset({
      top: 0,
      right: 0,
      bottom: 100,
      left: 0,
    });
    inView(".js-inview, .js-anm-mask, .js-fade").on("enter", function (el) {
      el.classList.add("is-show");
    });
  }

  function hideLoadingScreen() {
    $loadingElement.addClass("is-hidden");
    setTimeout(function () {
      $("body").removeClass("is-fixed");
      scrollAnimation();
    }, 1000);
  }

  function loadingScreen() {
    if ($loadingElement.length) {
      $("body").addClass("is-fixed");
      if (!sessionStorage.getItem("loaded")) {
        $(window).on("load", function () {
          hideLoadingScreen();
          sessionStorage.setItem("loaded", "true");
        });
      } else {
        hideLoadingScreen();
      }
    } else {
      setTimeout(() => {
        scrollAnimation();
      }, 100);
    }
  }

  function setFillHeightVh() {
    const setVh = function () {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    $(window).on("load resize", setVh);
  }

  function initAccordion() {
    var _scope_ = null;
    var btnEl = [".js-accordion-btn"];

    btnEl.forEach(function (element) {
      $(element, _scope_).each(function () {
        if (!$(this).hasClass("is-active")) {
          $(this).next().hide().toggleClass("is-active");
        }
        $(this).click(function () {
          $(this).toggleClass("is-active");
          $(this)
            .next()
            .slideToggle("fast", function () {
              $(this).toggleClass("is-active");
            });
        });
      });
    });
  }

  function initTabs() {
    $(".js-tabs-content").removeClass("is-current");

    $(".js-tabs-btn").click(function () {
      const $tabsWrap = $(this).closest(".js-tabs-wrap");
      $tabsWrap.find(".js-tabs-btn").removeClass("is-current");
      $(this).addClass("is-current");
      const tabName = $(this).data("tabs");
      $tabsWrap.find(".js-tabs-content").removeClass("is-current");
      $("#" + tabName).addClass("is-current");
    });

    $(".js-tabs-btn.is-current").trigger("click");
  }

  function menuHeader() {
    const $navItems = $(".nav_item.isSubnav");
    const $overlay = $(".l-header_nav_overlay");
    const $headerOpener = $(".l-header_opener");
    const $headerOpenerBtn = $(".l-header_opener button");
    const $headerNav = $(".l-header_nav");
    const $subnav = $(".subnav");
    const $subnavTitle = $(".subnav_title");
    const $navLinks = $navItems.find("> a");
    const mobileBreakpoint = 768;
    const $html = $("html");
    const $wrapper = $("#l-wrapper");
    let openedPos = 0;

    const disableScroll = () => {
      openedPos = window.scrollY;
      $html.addClass("disableScroll");
      $wrapper.css("top", -openedPos + "px");
    };

    const enableScroll = () => {
      $html.removeClass("disableScroll");
      $wrapper.css("top", "");
      window.scrollTo(0, openedPos);
    };
    const handleMobileEvents = () => {
      const isMobile = $(window).width() <= mobileBreakpoint;

      $headerOpenerBtn.off("click");
      $navLinks.off("click");
      $subnavTitle.off("click");
      $overlay.off("click");

      if (isMobile) {
        $headerOpenerBtn.on("click", function (e) {
          e.preventDefault();
          if ($headerNav.hasClass("open")) {
            enableScroll();
          } else {
            disableScroll();
          }
          $headerNav.toggleClass("open");
          $headerOpener.toggleClass("open");
          $overlay.toggleClass("open");
          $subnav.removeClass("open");
        });

        $navLinks.on("click", function (e) {
          e.preventDefault();
          const $currentSubnav = $(this).siblings(".subnav");
          $currentSubnav.toggleClass("open");
        });

        $subnavTitle.on("click", function () {
          $(this).parent(".subnav").removeClass("open");
        });

        $overlay.on("click", () => {
          $overlay.removeClass("open");
          $headerOpener.removeClass("open");
          $headerNav.removeClass("open");
          $subnav.removeClass("open");
          enableScroll();
        });
      }

      $navItems.off("mouseenter mouseleave");
      if (!isMobile) {
        $navItems.hover(
          () => $overlay.addClass("open"),
          () => $overlay.removeClass("open")
        );
      }
    };

    handleMobileEvents();
    $(window).on("resize", function () {
      handleMobileEvents();
      if ($(window).width() > mobileBreakpoint) {
        $html.removeClass("disableScroll");
        $wrapper.css("top", "");
        $headerNav.removeClass("open");
        $headerOpener.removeClass("open");
        $overlay.removeClass("open");
        $subnav.removeClass("open");
      }
    });
  }

  function pageTop() {
    $(".btn-topback").on("click", function () {
      $("body,html").animate({ scrollTop: 0 }, 300);
      return false;
    });
  }

  function convertSvg() {
    $(".svg").each(function () {
      var $img = $(this);
      var imgURL = $img.attr("src");

      $.get(
        imgURL,
        function (data) {
          var $svg = $(data).find("svg");

          $svg.attr("class", $img.attr("class"));
          $svg.removeAttr("xmlns:a");
          $svg.addClass("inline-svg");
          $img.replaceWith($svg);
        },
        "xml"
      );
    });
  }

  function anchorLink() {
    $("html").on("click", 'a.js-anc-btn[href^="#"]', function (e) {
      e.preventDefault();
      const href = $(this).attr("href");
      const target = $(href === "#" || href === "" ? "html" : href);
      const headerHeight = $(".l-header").innerHeight();
      const position = target.offset().top - headerHeight + 3;

      $("html, body").animate(
        {
          scrollTop: position,
        },
        "swing"
      );
    });
  }

  function anchorLinkHash() {
    let isNavigating = false;
    const setLinkHash = function () {
      if (isNavigating) return;
      const hash = window.location.hash;
      const anchorTarget = $(hash);
      if (anchorTarget.length) {
        const headerHeight = $(".l-header").innerHeight();
        const position = anchorTarget.offset().top - headerHeight + 3;
        history.pushState(null, null, hash);
        setTimeout(function () {
          $("html, body").animate(
            {
              scrollTop: position,
            },
            "swing"
          );
        }, 100);
      }
    };
    $(window).on("load resize", setLinkHash);
  }

  //--- init
  //------------
  $(function () {
    loadingScreen();
    setFillHeightVh();
    initAccordion();
    initTabs();
    menuHeader();
    convertSvg();
    anchorLink();
    anchorLinkHash();
    pageTop();
  });
})(jQuery);
