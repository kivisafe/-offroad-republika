// ===== APP INIT MODULE =====
// Dependencies: core.js, ui.js, profile.js, feed.js, app.js (remaining functions)
// This is the bootstrap/init sequence — call after all modules are loaded.

function initV10(){
  updateGarageBadge();
  renderHotToday();
  renderForYourBike();
  // toggleThread/toggleThreadV10 no longer needed (all threads are data-driven)
  // Seed service demo data
  seedServiceDemo();
  // Seed mods demo data
  seedModsDemo();
  // Inject credibility badges
  injectCredibilityBadges();
  // Tier display
  refreshTierDisplay();
  // Forum filters
  initForumFilters();
  // Auth system
  seedDemoAccounts();
  seedProfiles();
  refreshAuthUI();
  seedForumDemo();
  renderSavedPosts();
  updateZoneStats();
  renderDynamicListings();
  seedMessages();
  seedNotifications();
  seedBizSubscriptions();
  updateInboxBadge();
  updateStreak();
  // Streak reminder toast
  var _uid=getCurrentUserId();
  if(_uid){var _s=getStreak(_uid);if(_s&&_s.current>1)setTimeout(function(){showToast(_s.current+' дни поред! Не спирай.','success')},1500);}
  checkEventRegistrations();
  refreshHome();
  // Handle initial hash on page load
  if(location.hash && location.hash!=='#'){
    handleRoute();
  }
}

initOnboarding();
initV10();
