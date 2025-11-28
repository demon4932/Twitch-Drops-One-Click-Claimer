const claimButton = document.getElementById('claimButton');
const statusText = document.getElementById('statusText');
const count = document.getElementById('count');
const buttonText = document.getElementById('buttonText');

// Check if we're on the right page and count available drops
async function checkDropsAvailable() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('twitch.tv/drops/inventory')) {
      statusText.textContent = 'Navigate to Drops Inventory page';
      count.textContent = '⚠️';
      claimButton.disabled = true;
      return;
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: countClaimButtons
    });

    const dropsCount = result[0].result;
    count.textContent = dropsCount;
    
    if (dropsCount === 0) {
      statusText.textContent = 'No drops to claim';
      claimButton.disabled = true;
    } else {
      statusText.textContent = 'Ready to claim drops';
      claimButton.disabled = false;
    }
  } catch (error) {
    console.error('Error checking drops:', error);
    statusText.textContent = 'Error checking page';
    count.textContent = '❌';
  }
}

// Function to count claim buttons on the page
function countClaimButtons() {
  const buttons = document.querySelectorAll('[data-a-target="tw-core-button-label-text"]');
  let claimCount = 0;
  
  buttons.forEach(button => {
    if (button.textContent.trim() === 'Claim Now') {
      claimCount++;
    }
  });
  
  return claimCount;
}

// Function to click all claim buttons
function clickAllClaimButtons() {
  const buttons = document.querySelectorAll('[data-a-target="tw-core-button-label-text"]');
  let claimed = 0;
  
  buttons.forEach(button => {
    if (button.textContent.trim() === 'Claim Now') {
      // Find the parent button element and click it
      const parentButton = button.closest('button');
      if (parentButton) {
        setTimeout(() => {
          parentButton.click();
        }, claimed * 200); // Stagger clicks by 200ms to avoid issues
        claimed++;
      }
    }
  });
  
  return claimed;
}

// Handle claim button click
claimButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('twitch.tv/drops/inventory')) {
      // Navigate to the drops inventory page
      await chrome.tabs.update(tab.id, { url: 'https://www.twitch.tv/drops/inventory' });
      statusText.textContent = 'Navigating to drops page...';
      statusText.className = 'status-text';
      setTimeout(() => {
        window.close();
      }, 1000);
      return;
    }

    // Disable button and show loading
    claimButton.disabled = true;
    buttonText.innerHTML = '<span class="spinner"></span> Claiming...';
    statusText.textContent = 'Claiming drops...';

    // Execute the claim function
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clickAllClaimButtons
    });

    const claimedCount = result[0].result;

    // Update UI with success message
    if (claimedCount > 0) {
      statusText.textContent = 'Successfully claimed!';
      statusText.className = 'status-text success';
      count.textContent = claimedCount;
      buttonText.textContent = '✅ Claimed!';
      
      // Wait for all clicks to complete (200ms per claim + 1 second buffer) then refresh
      const totalTime = (claimedCount * 200) + 1000;
      setTimeout(async () => {
        await chrome.tabs.reload(tab.id);
        window.close();
      }, totalTime);
    } else {
      statusText.textContent = 'No drops found';
      buttonText.textContent = '🎯 Claim All Drops';
      claimButton.disabled = false;
    }

  } catch (error) {
    console.error('Error claiming drops:', error);
    statusText.textContent = 'Error claiming drops';
    statusText.className = 'status-text error';
    buttonText.textContent = '🎯 Claim All Drops';
    claimButton.disabled = false;
  }
});

// Check for available drops when popup opens
checkDropsAvailable();