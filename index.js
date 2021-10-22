// step 1
const dotenv = require("dotenv");
dotenv.config();
const { TwitterClient } = require("twitter-api-client");
const axios = require("axios");
const sharp = require("sharp");
const fs = require('fs');

// step 2
const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessTokenSecret: process.env.ACCESS_SECRET,
});

// step 3
async function get_followers() {
  const followers = await twitterClient.accountsAndUsers.followersList({
    screen_name: process.env.TWITTER_HANDLE,
    count: 3,
  });

  const image_data = [];
  let count = 0;

  const get_followers_img = new Promise((resolve, reject) => {
    followers.users.forEach((follower, index,arr) => {
      process_image(
        follower.profile_image_url_https,
        `${follower.screen_name}.png`
      ).then(() => {
        const follower_avatar = {
          input: `${follower.screen_name}.png`,
          top: 316,
          left: parseInt(`${1295 + 105 * index}`),
        };
        image_data.push(follower_avatar);
        count++;
        if (count === arr.length) resolve();
      });

    });
  });
  get_followers_img.then(() => {
     draw_image(image_data);
  });
}

//draw image function

async function draw_image(image_data) {
  try {
    const hour = new Date().getHours();
    const welcomeTypes = ["Morning", "Afternoon", "Evening", "Night"];
    // let welcomeText = "";

    if (hour >= 0 && hour <= 6) { 
      // welcomeText = welcomeTypes[0]
      await sharp('1500x500.jpeg').composite(image_data).toFile('new-twitter-banner.png').catch()
    } //bo
    else if (hour > 6 && hour <= 12) {
      await sharp('Afternoon.png').composite(image_data).toFile('new-twitter-banner.png').catch()
    }
    // welcomeText = welcomeTypes[1]; //fish
    else if (hour > 12 && hour <= 18) {
      await sharp('Evening.png').composite(image_data).toFile('new-twitter-banner.png').catch()
    }
    // welcomeText = welcomeTypes[2]; //wall
    else {
      await sharp('Night.png').composite(image_data).toFile('new-twitter-banner.png').catch()
    }
    // welcomeText = welcomeTypes[3]; //blue

    // const svg_greeting = await create_text(500, 100, welcomeText);

    // image_data.push({
    //   input: svg_greeting,
    //   top: 52,
    //   left: 220,
    // });

    await sharp("twitter-banner.png")
      .composite(image_data)
      .toFile("new-twitter-banner.png");

    // upload banner to twitter
    upload_banner(image_data);
  } catch (error) {
    console.log(error);
  }
}

// process image function

async function process_image(url, image_path) {
  await axios({
    url,
    responseType: "arraybuffer",
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        const rounded_corners = new Buffer.from(
          '<svg><rect x="0" y="0" width="75" height="75" rx="37.5" ry="37.5"/></svg>'
        );
        resolve(
          sharp(response.data)
            .resize(75, 75)
            .composite([
              {
                input: rounded_corners,
                blend: "dest-in",
              },
            ])
            .png()
            .toFile(image_path)
        );
      })
  );
}

// call function
// get_followers()

async function upload_banner(files) {
  try {
    const base64 = await fs.readFileSync("new-twitter-banner.png", {
      encoding: "base64",
    });
    await twitterClient.accountsAndUsers
      .accountUpdateProfileBanner({
        banner: base64,
      })
      .then(() => {
        console.log("Upload to Twitter done");
        delete_files(files);
      });
  } catch (error) {
    console.log(error);
  }
}

//delete files
async function delete_files(files) {
  try {
    files.forEach((file) => {
      if (file.input.includes('.png')) {
        fs.unlinkSync(file.input);
        console.log("File removed");
      }
    });
  } catch (err) {
    console.error(err);
  }
}

get_followers();
setInterval(() => {
  get_followers();
}, 60000);