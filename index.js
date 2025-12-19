const { Telegraf, Markup, session } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

// Import handlers
const profileHandler = require('./handlers/profileHandler');
const startHandler = require('./handlers/startHandler');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Use session middleware
bot.use(session({
  defaultSession: () => ({})
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware to attach user to context
bot.use(async (ctx, next) => {
  try {
    if (ctx.from) {
      let user = await User.findOne({ telegramId: ctx.from.id.toString() });
      
      if (!user) {
        user = new User({
          telegramId: ctx.from.id.toString(),
          username: ctx.from.username,
          firstName: ctx.from.first_name,
        });
        await user.save();
      }
      
      ctx.user = user;
    }
    await next();
  } catch (error) {
    console.error('Middleware error:', error);
    await next();
  }
});

// Start command
bot.start(async (ctx) => {
  await startHandler.handleStart(ctx);
});

// Profile command
bot.command('profile', async (ctx) => {
  await profileHandler.showProfile(ctx);
});

// Edit profile command
bot.command('edit', async (ctx) => {
  await profileHandler.startProfileEdit(ctx);
});

// Handle text messages for profile update
bot.on('text', async (ctx) => {
  // Check if we're in profile update flow
  if (ctx.session && ctx.session.profileStep) {
    await profileHandler.handleProfileUpdate(ctx);
    return;
  }
  
  // Handle other text messages...
  await ctx.reply('Type /help to see available commands');
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    
    // Profile related callbacks
    if (callbackData.includes('profile') || 
        callbackData === 'main_menu' || 
        callbackData === 'refresh_profile') {
      await profileHandler.handleProfileCallbacks(ctx);
      return;
    }
    
    // Handle other callbacks...
    await ctx.answerCbQuery();
    
  } catch (error) {
    console.error('Callback query error:', error);
    await ctx.answerCbQuery('❌ Error processing request');
  }
});

// Error handling
bot.catch((error, ctx) => {
  console.error('Bot error:', error);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Start bot
bot.launch()
  .then(() => {
    console.log('🤖 Bot is running...');
  })
  .catch(err => {
    console.error('Failed to start bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;