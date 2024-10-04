import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import snoowrap from 'snoowrap';
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});


const reddit = new snoowrap({
    userAgent: 'discord-bot-fetching-reddit-posts-v1.0 (by u/FLAWY_ME4264)',  // User agent as a string
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
});

const CLIENT_ID=process.env.CLIENT_ID
const GUILD_ID=process.env.GUILD_ID
const TOKEN=process.env.TOKEN

const rest=new REST({version:'9'}).setToken(TOKEN)

// Subreddit to fetch posts from (either hardcoded or from .env)
const SUBREDDIT = process.env.SUBREDDIT

client.on('interactionCreate',(interaction)=>{
    if(interaction.isChatInputCommand()){
        interaction.reply({content:'nsb!L = Latest post from the subreddit /n nsb!L flairname = latest post in the subreddit with that flair'})
    }
})

async function helper(){
    const commands=[
        {
            name:'help',
            description:'To know about commands'
        }
    ]
    try{
        console.log("Started refreshing application(/) commands"),
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        client.login(TOKEN)
    }
    catch(err){
        console.log(err)
    }
}

helper()

// Fetch the latest post from the specific subreddit
async function fetchLatestRedditPost() {
    try {
        const posts = await reddit.getSubreddit(SUBREDDIT).getNew({ limit: 1 });
        
        return posts[0] || null;
    } catch (error) {
        console.error('Error fetching the latest Reddit post:', error);
        return null;
    }
}

// Fetching the latest post from the subreddit with the specified flair
async function fetchLatestRedditPostWithFlair(flair) {
    try {
        const posts = await reddit.getSubreddit(SUBREDDIT).getNew({ limit: 50 });
        // Filter posts that match the flair
        const filteredPosts = posts.filter(post => post.link_flair_text && post.link_flair_text.toLowerCase() === flair.toLowerCase());

        return filteredPosts[0] || null;
    } catch (error) {
        console.error('Error fetching Reddit posts with flair:', error);
        return null;
    }
}

client.on('ready',()=>{
    console.log(`${client.user.tag} has started`)
})

client.on('messageCreate', async (message) => {
    // Check if the message starts with the nsb!L command
    if (message.content.startsWith('nsb!L')) {
        const args = message.content.split(' ').slice(1); // Get arguments after 'nsb!L'

        let latestPost;

        if (args.length === 0) {
            
            // If no flair is provided, fetch the latest post
            latestPost = await fetchLatestRedditPost();
        } else {
            // If a flair is provided, fetch the latest post with the flair
            const flair = args.join(' '); 
            latestPost = await fetchLatestRedditPostWithFlair(flair);
        }

        if (latestPost) {
            message.channel.send(`**${latestPost.title}**\n${latestPost.url}`);
        } else {
            const flairMessage = args.length === 0 ? '' : ` with the flair "${args.join(' ')}"`;
            message.channel.send(`Could not fetch a post from r/${SUBREDDIT}${flairMessage}.`);
        }
    }
});

client.login(TOKEN);
