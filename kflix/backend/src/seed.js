/**
 * seed.js — populates MongoDB with the movies & shows from the frontend
 * Run once: node src/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const connectDB = require('./config/db');
const User  = require('./models/User');
const Media = require('./models/Media');

// ─── Inline the frontend data (same as src/data/data.js) ─────────────────────

const moviesData = {
  NETFLIX: [
    { name: 'Red Notice',       img: 'https://wallpapercave.com/wp/wp10255107.jpg',                                                                 genre: 'Action Comedy'          },
    { name: 'Gray Man',         img: 'https://thepopblogph.com/wp-content/uploads/2022/07/tv-film-netflix-grey-man-new-keyart.jpg',                  genre: 'Action Spy'             },
    { name: 'Adam Project',     img: 'https://kelvinsmusings.com/wp-content/uploads/2022/03/images-4.jpeg',                                          genre: 'Sci-Fi Adventure'       },
    { name: 'Damsel',           img: 'https://bsmknighterrant.org/wp-content/uploads/2024/04/Damsel.png',                                            genre: 'Fantasy Action'         },
    { name: 'Heart Of Stone',   img: 'https://i.ytimg.com/vi/k_Ab5W2UkS4/maxresdefault.jpg',                                                        genre: 'Spy Thriller'           },
    { name: 'Extraction',       img: 'https://i.pinimg.com/736x/75/b5/70/75b570731999923833f5d732c8b04cf6.jpg',                                      genre: 'Action Thriller'        },
    { name: 'Extraction 2',     img: 'https://www.heavenofhorror.com/wp-content/uploads/2023/06/extraction-2-netflix-review-1200x675.jpg',           genre: 'Action Thriller'        },
  ],
  PRIME: [
    { name: 'Baby Driver',                  img: 'https://m.media-amazon.com/images/S/pv-target-images/da9c1bd15d59ae28f965577ad74b8a3ea8e4ecf97af2221ae567c5e69d23636b.jpg', genre: 'Crime Action'            },
    { name: 'Wanted',                       img: 'https://image.tmdb.org/t/p/original/4pBHu4jllypZBrrlik5gtISABF9.jpg',                                                       genre: 'Action Thriller'         },
    { name: 'John Wick',                    img: 'https://images2.alphacoders.com/550/550911.jpg',                                                                             genre: 'Action Thriller'         },
    { name: 'The Shawshank Redemption',     img: 'https://m.media-amazon.com/images/S/pv-target-images/851ab8ca1caf85fc12dbf43c08d56b63af948c4dd8ceba2992ee487234abd9bc.jpg', genre: 'Drama'                   },
    { name: 'Oppenheimer',                  img: 'https://m.media-amazon.com/images/S/pv-target-images/f716021a712441c8fdccddc9468e301e4cdcb18136b028c32a6d8bb42a41a4e1.jpg', genre: 'Historical Drama'        },
    { name: 'Lucy',                         img: 'https://my.kapook.com/imagescontent/fb_img/108/s_180565_8188.jpg',                                                           genre: 'Sci-Fi Thriller'         },
    { name: 'American Psycho',              img: 'https://m.media-amazon.com/images/S/pv-target-images/0083e2b6fbdc272e546b0e0e7e5388dd132c7104a938fc860cd45c5188164656.jpg', genre: 'Psychological Thriller'  },
  ],
  MARVEL: [
    { name: 'Iron Man',                 img: 'https://baylorlariat.com/wp-content/uploads/2018/02/Iron-Man-Movie_Poster_2008.jpg',             genre: 'Super Hero'       },
    { name: 'Captain America',          img: 'https://m.media-amazon.com/images/I/71sNQzzr3aS._UF1000,1000_QL80_.jpg',                        genre: 'Super Hero'       },
    { name: 'The Incredible Hulk',      img: 'https://images2.alphacoders.com/112/thumb-1920-1120632.jpg',                                    genre: 'Superhero Action' },
    { name: 'The Amazing Spider-Man 2', img: 'https://wallpaperswide.com/download/the_amazing_spiderman_2-wallpaper-1920x1080.jpg',            genre: 'Super Hero',     video: '/videos/movies/amazing-spiderman.mp4' },
    { name: 'Thor: Ragnarok',           img: 'https://images8.alphacoders.com/112/1120623.jpg',                                               genre: 'Superhero Fantasy' },
    { name: 'Black Panther',            img: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2018/02/Black-Panther-Poster-Title.jpg', genre: 'Superhero Sci-Fi'  },
  ],
  ROMANTIC: [
    { name: 'Eternal Sunshine',     img: 'https://shatpod.com/movies/wp-content/uploads/Eternal-Sunshine-of-the-Spotless-Mind-Poster-2004.jpg', genre: 'Romantic Drama'   },
    { name: 'La La Land',           img: 'https://i.pinimg.com/736x/0e/84/d5/0e84d580eb24bffc3dabc017412d7a4d.jpg',                             genre: 'Romantic Musical' },
    { name: 'The Notebook',         img: 'https://is1-ssl.mzstatic.com/image/thumb/Video114/v4/fe/b8/37/feb837a3-d766-3273-9c00-6d790a41e34e/pr_source.lsr/1200x675.jpg', genre: 'Romance Drama' },
    { name: '500 Days of Summer',   img: 'https://img.englishcinemakyiv.com/LYfCi0dsT2NXPoyTvbBt9wmYLh6XGueJTBmXtqJL7O8/resize:fill:800:450:1:0/gravity:sm/aHR0cHM6Ly9leHBhdGNpbmVtYXByb2QuYmxvYi5jb3JlLndpbmRvd3MubmV0L2ltYWdlcy80YjYzYTZlNy1lMWYxLTQ1ZTctOTdhOC04Y2JiNTJlN2E2NTAuanBn.jpg', genre: 'Romantic Comedy' },
    { name: 'My Fault',             img: 'https://wallpapercave.com/wp/wp13110627.jpg',                                                          genre: 'Teen Romance'     },
    { name: 'Fifty Shades of Grey', img: 'https://c4.wallpaperflare.com/wallpaper/900/598/454/movie-fifty-shades-of-grey-dakota-johnson-jamie-dornan-wallpaper-preview.jpg', genre: 'Romance Drama' },
  ],
  DC: [
    { name: 'The Dark Knight',        img: 'https://wallpaperswide.com/download/the_dark_knight_movie-wallpaper-1600x900.jpg', genre: 'Superhero' },
    { name: 'Man of Steel',           img: 'https://i.ebayimg.com/images/g/gtsAAOxyVaBSzhj9/s-l1200.jpg',                     genre: 'Superhero' },
    { name: 'Batman VS Superman',     img: 'https://wallpaperswide.com/download/batman_vs_superman_logo-wallpaper-1024x576.jpg', genre: 'Superhero' },
    { name: 'Shazam',                 img: 'https://w0.peakpx.com/wallpaper/721/772/HD-wallpaper-new-shazam-movie-poster.jpg', genre: 'Superhero' },
    { name: 'Black Adam',             img: 'https://images4.alphacoders.com/129/1292443.jpg',                                  genre: 'Superhero' },
    { name: 'Joker',                  img: 'https://m.media-amazon.com/images/S/pv-target-images/97da6d6bc6641ade91c5510f6539d10c46f3dbc367ba03718eb4db08ff968e3f.jpg', genre: 'Superhero' },
  ],
  TOP: [
    { name: 'The Shawshank Redemption', img: 'https://m.media-amazon.com/images/S/pv-target-images/851ab8ca1caf85fc12dbf43c08d56b63af948c4dd8ceba2992ee487234abd9bc.jpg', genre: 'Drama'                  },
    { name: 'The Godfather',            img: 'https://images5.alphacoders.com/131/thumb-1920-1315822.jpg',                                                                  genre: 'Crime Drama'            },
    { name: 'Fight Club',               img: 'https://vistapointe.net/images/fight-club-1.jpg',                                                                             genre: 'Psychological Thriller' },
    { name: 'Inception',                img: 'https://wallpaperswide.com/download/inception_2-wallpaper-1920x1200.jpg',                                                     genre: 'Sci-Fi Thriller'        },
    { name: 'Interstellar',             img: 'https://wallpapercave.com/wp/wp11717712.jpg',                                                                                 genre: 'Sci-Fi Drama'           },
    { name: 'Pulp Fiction',             img: 'https://wallpapercave.com/wp/wp7665508.jpg',                                                                                  genre: 'Crime Drama'            },
    { name: 'Forrest Gump',             img: 'https://wallpapercat.com/w/full/4/5/8/139214-2560x1440-desktop-hd-forrest-gump-wallpaper-photo.jpg',                          genre: 'Drama Comedy'           },
  ],
  DREAMWORKS: [
    { name: 'Kung Fu Panda', img: 'https://w0.peakpx.com/wallpaper/701/571/HD-wallpaper-kung-fu-panda.jpg',        genre: 'Animated Action Comedy'    },
    { name: 'Shrek',         img: 'https://www.kindpng.com/picc/m/49-494564_shrek-shrek-movie-poster-landscape-hd-png-download.png', genre: 'Animated Fantasy Comedy' },
    { name: 'Shrek 2',       img: 'https://wallpapersok.com/images/hd/shrek-2-poster-main-cast-1n0p7vu78dwbr3m0.jpg',               genre: 'Animated Fantasy Comedy' },
    { name: 'Puss In Boots', img: 'https://hd.wallpaperswide.com/thumbs/puss_in_boots_3d-t2.jpg',                  genre: 'Animated Adventure Comedy' },
    { name: 'Transformers',  img: 'https://w0.peakpx.com/wallpaper/67/356/HD-wallpaper-transformers-transformers-1.jpg', genre: 'Sci-Fi Action'          },
    { name: 'Gladiator',     img: 'https://pastposters.com/cdn/shop/files/gladiator-cinema-quad-movie-poster-_1_82369269-7d0e-4fe4-ac23-fd9b24887f05.jpg?v=1746727192', genre: 'Historical Action Drama' },
  ],
};

const showsData = {
  NETFLIX: [
    { name: 'Stranger Things', img: 'https://a-static.besthdwallpaper.com/stranger-things-s1-on-netflix-wallpaper-1680x1050-100055_5.jpg', genre: 'Sci-Fi'                },
    { name: 'Daredevil',       img: 'https://w0.peakpx.com/wallpaper/148/621/HD-wallpaper-tv-show-daredevil.jpg',                          genre: 'Superhero Action Drama' },
    { name: 'Money Heist',     img: 'https://content.tupaki.com/twdata/2021/0921/news/Money-Heist-Season-5-Volume-1-Garners-Rave-Reviews-1630723090-1920.jpg', genre: 'Crime Thriller' },
    { name: 'Squid Game',      img: 'https://www.koimoi.com/wp-content/new-galleries/2021/10/squid-game-director-denies-claims-of-the-show-being-a-ripoff-after-people-point-of-similarities-with-a-japanese-film-001.jpg', genre: 'Survival Drama' },
    { name: 'Dark',            img: 'https://www.dark.netflix.io/share/global.png',                                                        genre: 'Mystery Sci-Fi'        },
    { name: 'Breaking Bad',    img: 'https://wallpapercave.com/wp/wp6892113.png',                                                          genre: 'Crime Drama'           },
    { name: 'Narcos',          img: 'https://w0.peakpx.com/wallpaper/97/700/HD-wallpaper-tv-show-narcos.jpg',                              genre: 'Crime Biography'       },
  ],
  PRIME: [
    { name: 'The Boys',      img: 'https://4kwallpapers.com/images/wallpapers/the-boys-season-4-1920x1080-17287.jpg',                        genre: 'Superhero Action'        },
    { name: 'Peaky Blinders',img: 'https://m.media-amazon.com/images/S/pv-target-images/3edfb7e426426496d2d39167cc805674f7228d9e036caeffb6d8c65613ab821e.jpg', genre: 'Historical Crime Drama' },
    { name: 'Invincible',    img: 'https://4kwallpapers.com/images/wallpapers/invincible-season-1-2560x1440-13454.jpg',                      genre: 'Superhero Animation'     },
    { name: 'Mirzapur',      img: 'https://m.media-amazon.com/images/I/91Wr90x8YmL.jpg',                                                    genre: 'Action Crime'            },
    { name: 'Dexter',        img: 'https://m.media-amazon.com/images/S/pv-target-images/843e5bf5c94bb820756c08650255035729f91ec2cca2e03eb2fcf4464bb6c714.jpg', genre: 'Crime Drama' },
    { name: 'The Family Man',img: 'https://m.media-amazon.com/images/S/pv-target-images/b317763387b2a8f92aa35d16f87b875fb54437da752eafc87a4939e6b7cb330b.png', genre: 'Action Spy' },
    { name: 'The Summer',    img: 'https://m.media-amazon.com/images/S/pv-target-images/d602220fba5da98ba7f6e03bd1f3d68fd88db7dc0e2a4b338dabc2a29b177ff2.jpg', genre: 'Romantic', video: '/videos/shows/the summer.mp4' },
  ],
};

// ─── Seed users ───────────────────────────────────────────────────────────────

const seedUsers = async () => {
  await User.deleteMany({});

  const users = [
    { username: 'admin',  email: 'admin@kflix.com',  password: 'admin123',  role: 'admin'   },
    { username: 'user',   email: 'user@kflix.com',   password: 'kflix123',  role: 'user'    },
    { username: 'premium',email: 'premium@kflix.com',password: 'premium123',role: 'premium' },
  ];

  for (const u of users) {
    await User.create(u); // pre-save hook hashes password
  }
  console.log('✅  Users seeded');
};

// ─── Seed media ───────────────────────────────────────────────────────────────

const seedMedia = async () => {
  await Media.deleteMany({});
  const docs = [];

  for (const [platform, items] of Object.entries(moviesData)) {
    for (const item of items) {
      docs.push({ ...item, type: 'movie', platform });
    }
  }
  for (const [platform, items] of Object.entries(showsData)) {
    for (const item of items) {
      docs.push({ ...item, type: 'show', platform });
    }
  }

  await Media.insertMany(docs);
  console.log(`✅  Media seeded: ${docs.length} items`);
};

// ─── Run ──────────────────────────────────────────────────────────────────────

(async () => {
  await connectDB();
  await seedUsers();
  await seedMedia();
  console.log('🌱  Seed complete');
  process.exit(0);
})();
