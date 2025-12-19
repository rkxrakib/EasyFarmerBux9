const { Markup } = require('telegraf');
const User = require('../models/User');
const { isValidBEP20Address } = require('../utils/addressValidator');
const { formatWithUSD } = require('../utils/helpers');

/**
 * Display user profile
 */
async function showProfile(ctx) {
  try {
    console.log('Showing profile for user:', ctx.user._id);
    
    const user = await User.findById(ctx.user._id);
    if (!user) {
      console.log('User not found in database');
      return ctx.reply('❌ User profile not found. Please try again.');
    }

    // Format balance
    const balanceText = formatWithUSD ? formatWithUSD(user.balance) : `$${user.balance}`;
    
    // Create profile message
    const profileMessage = 
      `<b>📋 Your Profile:</b>\n\n` +
      `<b>🆔 Telegram:</b> <code>${user.telegramUsername || 'Not set'}</code>\n` +
      `<b>🐦 Twitter:</b> <code>${user.twitterUsername || 'Not set'}</code>\n` +
      `<b>💰 USDT (BEP20):</b> <code>${user.usdtBEP20Address || 'Not set'}</code>\n\n` +
      `<b>💰 Balance:</b> <b>${balanceText}</b>\n` +
      `<b>👥 Referrals:</b> <b>${user.referrals.length}</b>\n` +
      `<b>✅ Profile Status:</b> ${user.profileCompleted ? 'Completed' : 'Incomplete'}`;

    await ctx.replyWithHTML(
      profileMessage,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Edit Profile', 'edit_profile'),
          Markup.button.callback('🔄 Refresh', 'refresh_profile')
        ],
        [
          Markup.button.callback('🏠 Main Menu', 'main_menu')
        ]
      ])
    );

  } catch (error) {
    console.error('❌ Profile display error:', error);
    await ctx.reply('❌ Error displaying profile. Please try again later.');
  }
}

/**
 * Handle profile update step by step
 */
async function handleProfileUpdate(ctx) {
  try {
    console.log('Handling profile update for user:', ctx.user._id);
    
    // Get the full Mongoose document for updates
    const user = await User.findById(ctx.user._id);
    if (!user) {
      return ctx.reply('❌ User not found. Please start with /start command.');
    }

    // Step 1: Telegram Username
    if (ctx.session.profileStep === 'telegram') {
      const username = ctx.message.text.trim();
      
      // Validate Telegram username
      if (!username.startsWith('@')) {
        return await ctx.reply(
          '⚠️ Please enter a valid Telegram username starting with @\n' +
          'Example: @yourusername'
        );
      }
      
      if (username.length < 5) {
        return await ctx.reply('⚠️ Username is too short. Minimum 5 characters required.');
      }
      
      user.telegramUsername = username;
      await user.save();
      
      // Move to next step
      ctx.session.profileStep = 'twitter';
      return await ctx.replyWithHTML(
        '📝 <b>Step 2: Twitter Username</b>\n\n' +
        'Please enter your Twitter username (without @):\n' +
        'Example: yourusername'
      );
    }

    // Step 2: Twitter Username
    if (ctx.session.profileStep === 'twitter') {
      const twitterUsername = ctx.message.text.trim();
      
      // Remove @ if user included it
      const cleanUsername = twitterUsername.replace('@', '');
      
      // Basic validation
      if (cleanUsername.length < 1) {
        return await ctx.reply('⚠️ Please enter a valid Twitter username.');
      }
      
      if (cleanUsername.length > 15) {
        return await ctx.reply('⚠️ Twitter username is too long. Maximum 15 characters.');
      }
      
      user.twitterUsername = cleanUsername;
      await user.save();
      
      // Move to final step
      ctx.session.profileStep = 'usdt';
      return await ctx.replyWithHTML(
        '📝 <b>Step 3: USDT (BEP20) Address</b>\n\n' +
        'Please enter your USDT (BEP20) wallet address:\n' +
        '• Should start with 0x\n' +
        '• Should be exactly 42 characters\n' +
        '• Example: <code>0xa7c15a46fa8feb53140844e0b31d847e6087d2ca</code>\n\n' +
        '⚠️ <i>Make sure this is correct as it will be used for withdrawals.</i>'
      );
    }

    // Step 3: USDT BEP20 Address
    if (ctx.session.profileStep === 'usdt') {
      const usdtAddress = ctx.message.text.trim();
      
      // Validate USDT (BEP20) address
      if (!isValidBEP20Address(usdtAddress)) {
        return await ctx.replyWithHTML(
          '❌ <b>Invalid USDT (BEP20) Address!</b>\n\n' +
          'Please enter a valid USDT (BEP20) wallet address:\n' +
          '• Must start with <code>0x</code>\n' +
          '• Must be exactly 42 characters long\n' +
          '• Must be a valid BEP20 address\n' +
          '• Example: <code>0xa7c15a46fa8feb53140844e0b31d847e6087d2ca</code>\n\n' +
          '⚠️ <i>Double-check your address before submitting.</i>'
        );
      }
      
      // Save the address
      user.usdtBEP20Address = usdtAddress;
      user.profileCompleted = true;
      
      // Handle referral logic if exists
      if (ctx.session.referralId) {
        try {
          const referrer = await User.findOne({ telegramId: ctx.session.referralId });
          if (referrer) {
            referrer.referrals.push({
              userId: user.telegramId,
              username: user.username || user.firstName,
              completed: true,
              claimed: false,
              referredAt: new Date()
            });
            
            await referrer.save();
            
            // Optional: Add bonus to both users
            // referrer.balance += 10; // Example referral bonus
            // user.balance += 5; // Example welcome bonus
            // await Promise.all([referrer.save(), user.save()]);
            
            await ctx.replyWithHTML(
              `🎉 <b>Referral Bonus!</b>\n\n` +
              `You were referred by ${referrer.username || referrer.firstName}!\n` +
              `Thank you for joining through their referral link.`
            );
          }
        } catch (referralError) {
          console.error('Referral processing error:', referralError);
          // Continue even if referral fails
        }
      }
      
      // Save user and cleanup session
      await user.save();
      delete ctx.session.profileStep;
      delete ctx.session.referralId;
      
      // Success message
      await ctx.replyWithHTML(
        '✅ <b>Profile Successfully Updated!</b>\n\n' +
        `• Telegram: <code>${user.telegramUsername}</code>\n` +
        `• Twitter: <code>${user.twitterUsername}</code>\n` +
        `• USDT (BEP20): <code>${user.usdtBEP20Address}</code>\n\n` +
        '🎉 Your profile is now complete!\n' +
        'You can now participate in all activities and withdraw your earnings.'
      );
      
      // Show main menu
      return await require('./startHandler').showMainMenu(ctx);
    }

  } catch (error) {
    console.error('❌ Profile update error:', error);
    await ctx.replyWithHTML(
      '❌ <b>Error Saving Profile</b>\n\n' +
      'An error occurred while saving your profile data.\n' +
      'Please try again or contact support if the problem persists.'
    );
  }
}

/**
 * Start profile edit process
 */
async function startProfileEdit(ctx) {
  try {
    // Set first step
    ctx.session.profileStep = 'telegram';
    
    await ctx.replyWithHTML(
      '📝 <b>Edit Your Profile</b>\n\n' +
      'We will update your profile step by step.\n\n' +
      '<b>Step 1: Telegram Username</b>\n' +
      'Please enter your Telegram username (starting with @):\n' +
      'Example: @yourusername'
    );
    
  } catch (error) {
    console.error('Start profile edit error:', error);
    await ctx.reply('❌ Error starting profile edit. Please try again.');
  }
}

/**
 * Handle callback queries for profile
 */
async function handleProfileCallbacks(ctx) {
  try {
    const callbackData = ctx.callbackQuery.data;
    
    switch (callbackData) {
      case 'edit_profile':
        await ctx.answerCbQuery();
        await startProfileEdit(ctx);
        break;
        
      case 'refresh_profile':
        await ctx.answerCbQuery('Profile refreshed!');
        await showProfile(ctx);
        break;
        
      case 'main_menu':
        await ctx.answerCbQuery();
        await require('./startHandler').showMainMenu(ctx);
        break;
        
      default:
        await ctx.answerCbQuery();
        break;
    }
    
  } catch (error) {
    console.error('Profile callback error:', error);
    await ctx.answerCbQuery('❌ Error processing request');
  }
}

module.exports = {
  showProfile,
  handleProfileUpdate,
  startProfileEdit,
  handleProfileCallbacks
};