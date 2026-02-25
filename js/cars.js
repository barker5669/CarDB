const CAR_DB = [

  // ─── PRE-WAR (pre-1940) ──────────────────────────────────────────────────

  { name:"Bentley 4½ Litre",           make:"Bentley",      model:"4½ Litre",         era:"Pre-War",  flag:"🇬🇧", years:"1926–31", country:"UK",     produced:"665",    surviving:"~400",  value:"£1.5M–£4M",    rarity:"legendary", hagerty:"bentley/4.5_litre/1928/1928-bentley-4.5_litre",
    desc:"The car that built Bentley's legend. Four Le Mans victories. Supercharged 'Blower' versions are among the most valuable cars on earth." },

  { name:"Bentley 3 Litre",            make:"Bentley",      model:"3 Litre",           era:"Pre-War",  flag:"🇬🇧", years:"1921–29", country:"UK",     produced:"1,622", surviving:"~800",  value:"£200K–£600K",  rarity:"epic",      hagerty:"bentley/3_litre/1924/1924-bentley-3_litre",
    desc:"The original Bentley. Won Le Mans in 1924 and 1927. A large, powerful touring car that defined the Bentley Boys era." },

  { name:"Bentley Speed Six",          make:"Bentley",      model:"Speed Six",         era:"Pre-War",  flag:"🇬🇧", years:"1928–30", country:"UK",     produced:"182",   surviving:"~120",  value:"£2M–£5M",      rarity:"legendary", hagerty:"bentley/speed_six/1929/1929-bentley-speed_six",
    desc:"W.O. Bentley's personal favourite. Won Le Mans back-to-back in 1929 and 1930. One of the most significant pre-war racing cars." },

  { name:"Bentley 8 Litre",            make:"Bentley",      model:"8 Litre",           era:"Pre-War",  flag:"🇬🇧", years:"1930–31", country:"UK",     produced:"100",   surviving:"~80",   value:"£1M–£3M",      rarity:"legendary", hagerty:"bentley/8_litre/1930/1930-bentley-8_litre",
    desc:"W.O. Bentley's swansong — the ultimate gentleman's express. Nearly unstoppable until Rolls-Royce bought the company." },

  { name:"Rolls-Royce Silver Ghost",   make:"Rolls-Royce",  model:"Silver Ghost",      era:"Pre-War",  flag:"🇬🇧", years:"1907–26", country:"UK",     produced:"6,173", surviving:"~2,500",value:"£300K–£1M",    rarity:"epic",      hagerty:"rolls~royce/silver_ghost/1913/1913-rolls~royce-silver_ghost",
    desc:"Called 'the best car in the world' by Autocar in 1907. The foundation of Rolls-Royce's enduring reputation for refinement." },

  { name:"Rolls-Royce Phantom I",      make:"Rolls-Royce",  model:"Phantom I",         era:"Pre-War",  flag:"🇬🇧", years:"1925–31", country:"UK",     produced:"2,212", surviving:"~1,000",value:"£200K–£600K",  rarity:"epic",      hagerty:"rolls~royce/phantom_i/1927/1927-rolls~royce-phantom_i",
    desc:"The successor to the Silver Ghost, with more power and a higher chassis for coachbuilder bodywork. An icon of the jazz age." },

  { name:"Rolls-Royce Phantom II",     make:"Rolls-Royce",  model:"Phantom II",        era:"Pre-War",  flag:"🇬🇧", years:"1929–35", country:"UK",     produced:"1,672", surviving:"~900",  value:"£200K–£700K",  rarity:"epic",      hagerty:"rolls~royce/phantom_ii/1932/1932-rolls~royce-phantom_ii",
    desc:"A lower, more sporting chassis than its predecessor. Many were given spectacular coachbuilt bodies by Barker, Mulliner, and Park Ward." },

  { name:"Bugatti Type 35",            make:"Bugatti",      model:"Type 35",           era:"Pre-War",  flag:"🇫🇷", years:"1924–30", country:"France", produced:"336",   surviving:"~200",  value:"£600K–£2M",    rarity:"legendary", hagerty:"bugatti/type_35/1926/1926-bugatti-type_35",
    desc:"The most successful racing car in history by sheer number of victories — over 2,000. Ettore Bugatti's masterpiece of art and engineering." },

  { name:"Bugatti Type 35B",           make:"Bugatti",      model:"Type 35B",          era:"Pre-War",  flag:"🇫🇷", years:"1927–30", country:"France", produced:"~45",   surviving:"~30",   value:"£1M–£3M",      rarity:"legendary", hagerty:"bugatti/type_35b/1928/1928-bugatti-type_35b",
    desc:"The supercharged version of the Type 35, with a Roots-type blower adding significant power. Won the Targa Florio five times." },

  { name:"Bugatti Type 57",            make:"Bugatti",      model:"Type 57",           era:"Pre-War",  flag:"🇫🇷", years:"1934–40", country:"France", produced:"710",   surviving:"~450",  value:"£500K–£2M",    rarity:"legendary", hagerty:"bugatti/type_57/1937/1937-bugatti-type_57",
    desc:"Jean Bugatti's masterpiece. The Atlantique coupe version is one of the most beautiful cars ever built and sold for over $30M." },

  { name:"Alfa Romeo 8C 2300",         make:"Alfa Romeo",   model:"8C 2300",           era:"Pre-War",  flag:"🇮🇹", years:"1931–34", country:"Italy",  produced:"188",   surviving:"~100",  value:"£2M–£6M",      rarity:"legendary", hagerty:"alfa_romeo/8c_2300/1932/1932-alfa_romeo-8c_2300",
    desc:"Designed by Vittorio Jano. Won Le Mans four consecutive times 1931–34. Enzo Ferrari raced one. Simply the dominant car of its era." },

  { name:"Alfa Romeo 6C 1750",         make:"Alfa Romeo",   model:"6C 1750",           era:"Pre-War",  flag:"🇮🇹", years:"1929–33", country:"Italy",  produced:"~350",  surviving:"~200",  value:"£400K–£1.5M",  rarity:"legendary", hagerty:"alfa_romeo/6c_1750/1930/1930-alfa_romeo-6c_1750",
    desc:"Jano's twin-cam masterpiece. Won the Mille Miglia and Targa Florio. An effortlessly elegant machine with exceptional performance." },

  { name:"Alfa Romeo 2900B",           make:"Alfa Romeo",   model:"2900B",             era:"Pre-War",  flag:"🇮🇹", years:"1937–39", country:"Italy",  produced:"~40",   surviving:"~30",   value:"£5M–£15M",     rarity:"legendary", hagerty:"alfa_romeo/8c_2900b/1938/1938-alfa_romeo-8c_2900b",
    desc:"Perhaps the finest pre-war road car. Supercharged straight-eight, twin-cam. Regularly sets world records at auction." },

  { name:"Mercedes-Benz 500K",         make:"Mercedes-Benz",model:"500K",              era:"Pre-War",  flag:"🇩🇪", years:"1934–36", country:"Germany",produced:"354",   surviving:"~200",  value:"£800K–£3M",    rarity:"legendary", hagerty:"mercedes~benz/500k/1935/1935-mercedes~benz-500k",
    desc:"A supercharged grand tourer of extraordinary presence. The 'K' stands for Kompressor. Bodywork by coachbuilders Sindelfingen." },

  { name:"Mercedes-Benz 540K",         make:"Mercedes-Benz",model:"540K",              era:"Pre-War",  flag:"🇩🇪", years:"1936–40", country:"Germany",produced:"419",   surviving:"~250",  value:"£1M–£5M",      rarity:"legendary", hagerty:"mercedes~benz/540k/1937/1937-mercedes~benz-540k",
    desc:"The pinnacle of pre-war Mercedes luxury. 180bhp supercharged straight-eight. Special Roadster versions fetch over $10M at auction." },

  { name:"Auto Union Type C",          make:"Auto Union",   model:"Type C",            era:"Pre-War",  flag:"🇩🇪", years:"1936–37", country:"Germany",produced:"~5",    surviving:"3",     value:"£15M+",        rarity:"legendary", hagerty:"",
    desc:"Ferdinand Porsche's mid-engined 520bhp Grand Prix monster. One of the most radical racing cars ever built. Extraordinarily rare survivor." },

  { name:"SS Jaguar 100",              make:"SS Cars",      model:"Jaguar 100",        era:"Pre-War",  flag:"🇬🇧", years:"1935–40", country:"UK",     produced:"314",   surviving:"~200",  value:"£200K–£500K",  rarity:"epic",      hagerty:"ss/100/1937/1937-ss-100",
    desc:"The car that launched the Jaguar name. 100mph performance, long bonnet, dramatic looks. William Lyons' first masterpiece." },

  { name:"Lagonda V12",                make:"Lagonda",      model:"V12",               era:"Pre-War",  flag:"🇬🇧", years:"1938–40", country:"UK",     produced:"~189",  surviving:"~100",  value:"£400K–£1.2M",  rarity:"legendary", hagerty:"lagonda/v12/1939/1939-lagonda-v12",
    desc:"W.O. Bentley designed this for Lagonda after leaving his own company. Won Le Mans overall in 1935. One of the great British pre-war cars." },

  { name:"Ford Model T",               make:"Ford",         model:"Model T",           era:"Pre-War",  flag:"🇺🇸", years:"1908–27", country:"USA",    produced:"16.5M", surviving:"~50,000",value:"£8K–£25K",     rarity:"common",    hagerty:"ford/model_t/1923/1923-ford-model_t",
    desc:"Changed the world. The first mass-produced car, built on the moving assembly line. Any colour you like, as long as it's black." },

  { name:"Ford Model A",               make:"Ford",         model:"Model A",           era:"Pre-War",  flag:"🇺🇸", years:"1927–31", country:"USA",    produced:"4.9M",  surviving:"~100K", value:"£12K–£40K",    rarity:"common",    hagerty:"ford/model_a/1930/1930-ford-model_a",
    desc:"Replaced the Model T and offered significantly more style and comfort. One of the most collectible American pre-war cars today." },

  { name:"Austin Seven",               make:"Austin",       model:"Seven",             era:"Pre-War",  flag:"🇬🇧", years:"1922–39", country:"UK",     produced:"290,000",surviving:"~10,000",value:"£8K–£30K",    rarity:"common",    hagerty:"austin/7/1932/1932-austin-7",
    desc:"The car that put Britain on wheels. Inspired BMW, Rosengart, Dixi, and the original Lotus. Practically indestructible." },

  { name:"MG M-Type Midget",           make:"MG",           model:"M-Type Midget",     era:"Pre-War",  flag:"🇬🇧", years:"1928–32", country:"UK",     produced:"3,235", surviving:"~500",  value:"£25K–£70K",    rarity:"rare",      hagerty:"mg/m_type/1930/1930-mg-m_type",
    desc:"The original MG Midget. Small, light, and surprisingly quick for the era. Started the British sports car tradition that continues today." },

  { name:"Frazer Nash TT Replica",     make:"Frazer Nash",  model:"TT Replica",        era:"Pre-War",  flag:"🇬🇧", years:"1931–38", country:"UK",     produced:"~85",   surviving:"~60",   value:"£150K–£400K",  rarity:"epic",      hagerty:"",
    desc:"A unique chain-drive sports car with no differential. Every surviving example is different. Beloved by the most committed enthusiast drivers." },

  { name:"Aston Martin Le Mans",       make:"Aston Martin", model:"Le Mans",           era:"Pre-War",  flag:"🇬🇧", years:"1932–34", country:"UK",     produced:"~100",  surviving:"~60",   value:"£200K–£600K",  rarity:"epic",      hagerty:"aston_martin/le_mans/1933/1933-aston_martin-le_mans",
    desc:"The first Aston Martin to bear the Le Mans name. A beautiful Ulster-era sports car with a genuine racing pedigree." },

  { name:"Talbot-Lago T150SS",         make:"Talbot-Lago",  model:"T150SS",            era:"Pre-War",  flag:"🇫🇷", years:"1937–39", country:"France", produced:"~16",   surviving:"~12",   value:"£5M–£15M",     rarity:"legendary", hagerty:"",
    desc:"Among the most beautiful cars ever created. The Figoni et Falaschi 'Teardrop' coachwork is pure art deco sculpture." },

  { name:"Hispano-Suiza J12",          make:"Hispano-Suiza",model:"J12",               era:"Pre-War",  flag:"🇪🇸", years:"1931–38", country:"Spain",  produced:"~120",  surviving:"~80",   value:"£1M–£4M",      rarity:"legendary", hagerty:"",
    desc:"A V12-powered behemoth from Spain's great marque. Often fitted with spectacular coachbuilt bodies. A rival to Rolls-Royce at its peak." },

  // ─── 1950s ───────────────────────────────────────────────────────────────

  { name:"Jaguar XK120 Roadster",      make:"Jaguar",       model:"XK120",             era:"1950s",    flag:"🇬🇧", years:"1948–54", country:"UK",     produced:"7,631", surviving:"~3,000",value:"£50K–£120K",   rarity:"rare",      hagerty:"jaguar/xk120/1952/1952-jaguar-xk120",
    desc:"The world's fastest production car at launch. 120mph from a twin-cam straight-six. Launched Jaguar's sporting legend." },

  { name:"Jaguar XK120 Coupé",         make:"Jaguar",       model:"XK120",             era:"1950s",    flag:"🇬🇧", years:"1951–54", country:"UK",     produced:"2,678", surviving:"~1,500",value:"£45K–£100K",   rarity:"rare",      hagerty:"jaguar/xk120/1953/1953-jaguar-xk120-fhc",
    desc:"The closed version of the XK120. Arguably more elegant than the roadster. Equally sought-after by collectors." },

  { name:"Jaguar XK140",               make:"Jaguar",       model:"XK140",             era:"1950s",    flag:"🇬🇧", years:"1954–57", country:"UK",     produced:"8,884", surviving:"~4,000",value:"£40K–£90K",    rarity:"rare",      hagerty:"jaguar/xk140/1955/1955-jaguar-xk140",
    desc:"A refined successor to the XK120 with rack-and-pinion steering and a more powerful engine. More usable, equally beautiful." },

  { name:"Jaguar XK150",               make:"Jaguar",       model:"XK150",             era:"1950s",    flag:"🇬🇧", years:"1957–61", country:"UK",     produced:"9,382", surviving:"~5,000",value:"£40K–£90K",    rarity:"rare",      hagerty:"jaguar/xk150/1958/1958-jaguar-xk150",
    desc:"The last of the XK series. Wider body, disc brakes on all four corners. The 3.8S variant is particularly fast and desirable." },

  { name:"Jaguar C-Type",              make:"Jaguar",       model:"C-Type",            era:"1950s",    flag:"🇬🇧", years:"1951–53", country:"UK",     produced:"53",    surviving:"~40",   value:"£3M–£8M",      rarity:"legendary", hagerty:"jaguar/c~type/1952/1952-jaguar-c~type",
    desc:"Won Le Mans in 1951 and 1953. Introduced disc brakes to racing. One of the most significant competition cars Britain ever produced." },

  { name:"Jaguar D-Type",              make:"Jaguar",       model:"D-Type",            era:"1950s",    flag:"🇬🇧", years:"1954–57", country:"UK",     produced:"75",    surviving:"~60",   value:"£4M–£10M",     rarity:"legendary", hagerty:"jaguar/d~type/1955/1955-jaguar-d~type",
    desc:"Won Le Mans three times. Monocoque aluminium construction, aircraft-style fin. Among the most beautiful racing cars ever made." },

  { name:"Mercedes-Benz 300SL Gullwing",make:"Mercedes-Benz",model:"300SL Gullwing",  era:"1950s",    flag:"🇩🇪", years:"1954–57", country:"Germany",produced:"1,400", surviving:"~1,200",value:"£800K–£1.5M",  rarity:"legendary", hagerty:"mercedes~benz/300sl/1955/1955-mercedes~benz-300sl-gullwing",
    desc:"The world's first fuel-injected production car. Gullwing doors required by the tubular spaceframe. An icon from every angle." },

  { name:"Mercedes-Benz 300SL Roadster",make:"Mercedes-Benz",model:"300SL Roadster",  era:"1950s",    flag:"🇩🇪", years:"1957–63", country:"Germany",produced:"1,858", surviving:"~1,600",value:"£700K–£1.2M",  rarity:"legendary", hagerty:"mercedes~benz/300sl/1958/1958-mercedes~benz-300sl-roadster",
    desc:"More practical than the Gullwing with conventional doors. Many consider it even more elegant. Low-pivot swing axle improves handling." },

  { name:"Mercedes-Benz 190SL",        make:"Mercedes-Benz",model:"190SL",            era:"1950s",    flag:"🇩🇪", years:"1955–63", country:"Germany",produced:"25,881",surviving:"~12,000",value:"£50K–£100K",   rarity:"rare",      hagerty:"mercedes~benz/190sl/1957/1957-mercedes~benz-190sl",
    desc:"A softer companion to the 300SL. Beautifully styled and now highly sought-after. Often seen at concours in stunning condition." },

  { name:"Aston Martin DB2/4",         make:"Aston Martin", model:"DB2/4",             era:"1950s",    flag:"🇬🇧", years:"1953–57", country:"UK",     produced:"764",   surviving:"~500",  value:"£120K–£300K",  rarity:"epic",      hagerty:"aston_martin/db2!4/1955/1955-aston_martin-db2!4",
    desc:"The first 2+2 Aston, with a practical hatchback. W.O. Bentley's twin-cam six. The foundation of the DB bloodline." },

  { name:"Aston Martin DB Mark III",   make:"Aston Martin", model:"DB Mark III",       era:"1950s",    flag:"🇬🇧", years:"1957–59", country:"UK",     produced:"551",   surviving:"~400",  value:"£150K–£350K",  rarity:"epic",      hagerty:"aston_martin/db_mark_iii/1958/1958-aston_martin-db_mark_iii",
    desc:"A significant advance over the DB2/4. Disc brakes, revised engine, new grille. The final evolution before the legendary DB4." },

  { name:"Ferrari 250 GT Europa",      make:"Ferrari",      model:"250 GT Europa",     era:"1950s",    flag:"🇮🇹", years:"1953–56", country:"Italy",  produced:"36",    surviving:"~30",   value:"£400K–£900K",  rarity:"legendary", hagerty:"ferrari/250_gt/1955/1955-ferrari-250_gt",
    desc:"Pininfarina's first collaboration with Ferrari on the 250 series. A grand tourer of exceptional elegance and early rarity." },

  { name:"Ferrari 250 GT Boano",       make:"Ferrari",      model:"250 GT Boano",      era:"1950s",    flag:"🇮🇹", years:"1956–57", country:"Italy",  produced:"74",    surviving:"~65",   value:"£300K–£700K",  rarity:"epic",      hagerty:"ferrari/250_gt/1956/1956-ferrari-250_gt-coupe",
    desc:"Boano's Coupé was the principal 250 GT body in this period. Established Ferrari as a serious road car manufacturer alongside its racing success." },

  { name:"Ferrari 250 GT TdF",         make:"Ferrari",      model:"250 GT Tour de France",era:"1950s", flag:"🇮🇹", years:"1956–59", country:"Italy",  produced:"84",    surviving:"~70",   value:"£3M–£8M",      rarity:"legendary", hagerty:"ferrari/250_gt_tdf/1957/1957-ferrari-250_gt_tdf",
    desc:"Named for its Tour de France victories. A lightweight competition GT with outside door hinges and covered headlights. Utterly desirable." },

  { name:"Maserati A6GCS",             make:"Maserati",     model:"A6GCS",             era:"1950s",    flag:"🇮🇹", years:"1953–54", country:"Italy",  produced:"52",    surviving:"~40",   value:"£1.5M–£4M",    rarity:"legendary", hagerty:"maserati/a6gcs/1953/1953-maserati-a6gcs",
    desc:"Pininfarina-styled sports racer. Won at the Nürburgring with Stirling Moss. An intensely beautiful and rare Italian thoroughbred." },

  { name:"BMW 507",                    make:"BMW",          model:"507",               era:"1950s",    flag:"🇩🇪", years:"1956–59", country:"Germany",produced:"252",   surviving:"~200",  value:"£2M–£5M",      rarity:"legendary", hagerty:"bmw/507/1957/1957-bmw-507",
    desc:"The most beautiful BMW ever made. Designed by Albrecht Goertz. Elvis owned one. Low production saved BMW from bankruptcy." },

  { name:"Austin-Healey 100/4",        make:"Austin-Healey",model:"100/4",             era:"1950s",    flag:"🇬🇧", years:"1953–56", country:"UK",     produced:"10,688",surviving:"~5,000",value:"£30K–£70K",    rarity:"rare",      hagerty:"austin~healey/100/1954/1954-austin~healey-100",
    desc:"A proper big-engined British sports car at an affordable price. Won the Le Mans Index of Performance. A thrilling, if challenging, drive." },

  { name:"Austin-Healey 100M",         make:"Austin-Healey",model:"100M",              era:"1950s",    flag:"🇬🇧", years:"1955–56", country:"UK",     produced:"640",   surviving:"~400",  value:"£50K–£110K",   rarity:"rare",      hagerty:"austin~healey/100m/1955/1955-austin~healey-100m",
    desc:"The factory Le Mans specification: louvred bonnet, twin carburettors, higher compression. Significantly quicker than standard." },

  { name:"Triumph TR2",                make:"Triumph",      model:"TR2",               era:"1950s",    flag:"🇬🇧", years:"1953–55", country:"UK",     produced:"8,628", surviving:"~3,000",value:"£20K–£50K",    rarity:"rare",      hagerty:"triumph/tr2/1954/1954-triumph-tr2",
    desc:"The first proper TR. Timed at 124mph at Jabbeke. The Standard Vanguard engine transformed into something genuinely sporting." },

  { name:"Triumph TR3A",               make:"Triumph",      model:"TR3A",              era:"1950s",    flag:"🇬🇧", years:"1957–62", country:"UK",     produced:"58,236",surviving:"~15,000",value:"£18K–£45K",   rarity:"common",    hagerty:"triumph/tr3a/1958/1958-triumph-tr3a",
    desc:"The definitive early TR. Disc brakes, external door handles, full-width grille. Adored in America. Hugely practical to own and run." },

  { name:"MGA Twin Cam",               make:"MG",           model:"MGA Twin Cam",      era:"1950s",    flag:"🇬🇧", years:"1958–60", country:"UK",     produced:"2,111", surviving:"~800",  value:"£35K–£80K",    rarity:"rare",      hagerty:"mg/mga_twin_cam/1959/1959-mg-mga_twin_cam",
    desc:"MG's first twin-cam engine in a road car. Suffered from overheating issues that tarnished its reputation but now highly prized." },

  { name:"MGA Roadster",               make:"MG",           model:"MGA",               era:"1950s",    flag:"🇬🇧", years:"1955–62", country:"UK",     produced:"58,750",surviving:"~20,000",value:"£15K–£40K",   rarity:"common",    hagerty:"mg/mga/1957/1957-mg-mga",
    desc:"A complete restyle from the T-series. Modern, aerodynamic, and capable. Britain's biggest-selling sports car of its era." },

  { name:"Citroën DS19",               make:"Citroën",      model:"DS19",              era:"1950s",    flag:"🇫🇷", years:"1955–68", country:"France", produced:"1,456,115",surviving:"~20,000",value:"£15K–£50K",  rarity:"rare",      hagerty:"citroen/ds/1958/1958-citroen-ds",
    desc:"Unveiled in 1955 to gasps at the Paris Motor Show. Hydropneumatic suspension, self-centering steering, and aerodynamic bodywork 20 years ahead." },

  { name:"Alfa Romeo Giulietta Sprint", make:"Alfa Romeo",  model:"Giulietta Sprint",  era:"1950s",    flag:"🇮🇹", years:"1954–65", country:"Italy",  produced:"27,142",surviving:"~8,000",value:"£25K–£65K",    rarity:"rare",      hagerty:"alfa_romeo/giulietta/1958/1958-alfa_romeo-giulietta-sprint",
    desc:"Bertone's masterpiece of compact elegance. The twin-cam engine made it faster than cars twice its size. Started the Alfa coupé dynasty." },

  { name:"Alfa Romeo Giulietta Spider", make:"Alfa Romeo",  model:"Giulietta Spider",  era:"1950s",    flag:"🇮🇹", years:"1955–62", country:"Italy",  produced:"17,096",surviving:"~6,000",value:"£30K–£80K",    rarity:"rare",      hagerty:"alfa_romeo/giulietta_spider/1958/1958-alfa_romeo-giulietta_spider",
    desc:"Pininfarina's open version. Light, agile, tuneable twin-cam. The spiritual ancestor of every Italian roadster since." },

  { name:"Lancia Aurelia B20GT",       make:"Lancia",       model:"Aurelia B20GT",     era:"1950s",    flag:"🇮🇹", years:"1951–58", country:"Italy",  produced:"3,871", surviving:"~1,500",value:"£80K–£250K",   rarity:"epic",      hagerty:"lancia/aurelia/1953/1953-lancia-aurelia-b20gt",
    desc:"The world's first true Gran Turismo. V6 engine, de Dion rear axle, Pininfarina body. Class winner at Le Mans and Targa Florio." },

  { name:"Porsche 356A",               make:"Porsche",      model:"356A",              era:"1950s",    flag:"🇩🇪", years:"1955–59", country:"Germany",produced:"10,668",surviving:"~6,000",value:"£70K–£180K",   rarity:"rare",      hagerty:"porsche/356a/1957/1957-porsche-356a",
    desc:"The first Porsche to carry the A designation. Curved windscreen, improved suspension, more power. The start of something remarkable." },

  { name:"Porsche 356B",               make:"Porsche",      model:"356B",              era:"1950s",    flag:"🇩🇪", years:"1959–63", country:"Germany",produced:"30,963",surviving:"~15,000",value:"£60K–£150K",  rarity:"rare",      hagerty:"porsche/356b/1961/1961-porsche-356b",
    desc:"Higher headlights, larger bumpers, more performance variants. The Carrera 2 version with a four-cam engine is particularly sought after." },

  { name:"Volkswagen Beetle",          make:"Volkswagen",   model:"Beetle",            era:"1950s",    flag:"🇩🇪", years:"1938–2003",country:"Germany",produced:"21.5M", surviving:"~500K", value:"£10K–£35K",    rarity:"common",    hagerty:"volkswagen/beetle/1957/1957-volkswagen-beetle",
    desc:"The people's car. More produced than any other model in history. Split-window and oval-window early cars are now most desirable." },

  { name:"Chevrolet Corvette C1",      make:"Chevrolet",    model:"Corvette C1",       era:"1950s",    flag:"🇺🇸", years:"1953–62", country:"USA",    produced:"67,015",surviving:"~20,000",value:"£30K–£200K",  rarity:"rare",      hagerty:"chevrolet/corvette/1957/1957-chevrolet-corvette",
    desc:"America's sports car. Early six-cylinder cars are rare; the 1957 fuel-injected version is a landmark. Pure American optimism in fibreglass." },

  { name:"Ford Thunderbird 1st Gen",   make:"Ford",         model:"Thunderbird",       era:"1950s",    flag:"🇺🇸", years:"1955–57", country:"USA",    produced:"53,166",surviving:"~20,000",value:"£30K–£80K",   rarity:"rare",      hagerty:"ford/thunderbird/1956/1956-ford-thunderbird",
    desc:"The original two-seat Thunderbird. Porthole windows, continental spare. Ford's answer to the Corvette, and arguably more stylish." },

  { name:"AC Ace",                     make:"AC",           model:"Ace",               era:"1950s",    flag:"🇬🇧", years:"1954–63", country:"UK",     produced:"~223",  surviving:"~180",  value:"£100K–£300K",  rarity:"epic",      hagerty:"ac/ace/1957/1957-ac-ace",
    desc:"The elegant British roadster that became the basis for the Cobra. Tubular frame, transverse leaf springs, and a beautiful Tojeiro body." },

  { name:"Morgan Plus 4",              make:"Morgan",       model:"Plus 4",            era:"1950s",    flag:"🇬🇧", years:"1950–69", country:"UK",     produced:"~3,000",surviving:"~2,000",value:"£30K–£80K",    rarity:"rare",      hagerty:"morgan/plus_4/1956/1956-morgan-plus_4",
    desc:"Traditional Morgan with a proper Triumph engine. Hand-built in Malvern. Essentially unchanged for decades and loved for exactly that reason." },

  // ─── 1960s ───────────────────────────────────────────────────────────────

  { name:"Jaguar E-Type Series 1 Roadster",make:"Jaguar",  model:"E-Type S1",         era:"1960s",    flag:"🇬🇧", years:"1961–68", country:"UK",     produced:"7,827", surviving:"~4,000",value:"£80K–£200K",   rarity:"rare",      hagerty:"jaguar/e~type/1963/1963-jaguar-e~type",
    desc:"Enzo Ferrari called it 'the most beautiful car ever made.' 150mph, £2,098 in 1961. The car that defined the swinging sixties." },

  { name:"Jaguar E-Type Series 1 Coupé",make:"Jaguar",    model:"E-Type S1",         era:"1960s",    flag:"🇬🇧", years:"1961–68", country:"UK",     produced:"7,669", surviving:"~4,000",value:"£70K–£160K",   rarity:"rare",      hagerty:"jaguar/e~type/1964/1964-jaguar-e~type-fhc",
    desc:"The fastback version of the E-Type. Equally beautiful profile, more practical with the hatchback. The 2+2 version seats four." },

  { name:"Jaguar E-Type Series 2",     make:"Jaguar",      model:"E-Type S2",         era:"1960s",    flag:"🇬🇧", years:"1968–71", country:"UK",     produced:"18,812",surviving:"~8,000",value:"£45K–£100K",   rarity:"rare",      hagerty:"jaguar/e~type/1970/1970-jaguar-e~type_s2",
    desc:"Revised for US regulations: open headlights, larger bumpers. Many prefer the purity of the S1 but the S2 drives beautifully." },

  { name:"Jaguar E-Type Series 3 V12", make:"Jaguar",      model:"E-Type S3",         era:"70s–80s",  flag:"🇬🇧", years:"1971–75", country:"UK",     produced:"15,290",surviving:"~8,000",value:"£40K–£80K",    rarity:"rare",      hagerty:"jaguar/e~type/1972/1972-jaguar-e~type_s3",
    desc:"The 5.3-litre V12 transforms the E-Type. Smoother, faster, more relaxed. The roadster version in particular is now highly regarded." },

  { name:"Aston Martin DB4",           make:"Aston Martin", model:"DB4",               era:"1960s",    flag:"🇬🇧", years:"1958–63", country:"UK",     produced:"1,110", surviving:"~800",  value:"£400K–£900K",  rarity:"epic",      hagerty:"aston_martin/db4/1961/1961-aston_martin-db4",
    desc:"The first Aston built at Newport Pagnell. Touring of Milan body, twin-cam six. The GT and Zagato variants are the rarest and most valuable." },

  { name:"Aston Martin DB4 GT Zagato", make:"Aston Martin", model:"DB4 GT Zagato",     era:"1960s",    flag:"🇬🇧", years:"1960–63", country:"UK",     produced:"19",    surviving:"19",    value:"£10M–£20M",    rarity:"legendary", hagerty:"aston_martin/db4_zagato/1961/1961-aston_martin-db4_zagato",
    desc:"Just 19 built. Zagato's lightweight body, twin-plug engine. One of the most coveted and valuable British cars in existence." },

  { name:"Aston Martin DB5",           make:"Aston Martin", model:"DB5",               era:"1960s",    flag:"🇬🇧", years:"1963–65", country:"UK",     produced:"1,058", surviving:"~900",  value:"£500K–£1.2M",  rarity:"epic",      hagerty:"aston_martin/db5/1964/1964-aston_martin-db5",
    desc:"James Bond's car. Twin-cam straight-six, five-speed gearbox, Connolly leather. The definitive British grand tourer." },

  { name:"Aston Martin DB6",           make:"Aston Martin", model:"DB6",               era:"1960s",    flag:"🇬🇧", years:"1965–70", country:"UK",     produced:"1,575", surviving:"~1,300",value:"£300K–£700K",  rarity:"epic",      hagerty:"aston_martin/db6/1967/1967-aston_martin-db6",
    desc:"The most refined of the classic Astons. Improved aerodynamics, better handling, more power. Often considered the best of the DB series." },

  { name:"Ferrari 250 GTO",            make:"Ferrari",      model:"250 GTO",           era:"1960s",    flag:"🇮🇹", years:"1962–64", country:"Italy",  produced:"36",    surviving:"36",    value:"£40M–£70M",    rarity:"legendary", hagerty:"ferrari/250_gto/1962/1962-ferrari-250_gto",
    desc:"The holy grail. Three-time World GT Championship winner. The most valuable car ever sold at auction — over $70M. Pure motorsport icon." },

  { name:"Ferrari 250 GT Lusso",       make:"Ferrari",      model:"250 GT Lusso",      era:"1960s",    flag:"🇮🇹", years:"1962–64", country:"Italy",  produced:"350",   surviving:"~300",  value:"£700K–£1.5M",  rarity:"legendary", hagerty:"ferrari/250_gt_lusso/1963/1963-ferrari-250_gt_lusso",
    desc:"Pininfarina's final 250 GT. An elegant grand tourer balancing beauty and performance. Steve McQueen owned one. Near-perfect proportions." },

  { name:"Ferrari 250 GT Berlinetta SWB",make:"Ferrari",   model:"250 GT SWB",        era:"1960s",    flag:"🇮🇹", years:"1959–62", country:"Italy",  produced:"165",   surviving:"~155",  value:"£5M–£12M",     rarity:"legendary", hagerty:"ferrari/250_gt/1961/1961-ferrari-250_gt-swb",
    desc:"Short Wheelbase Berlinetta. A 100kg lighter than the long-wheelbase GT, perfect for circuit use. Among the greatest road-racers." },

  { name:"Ferrari 275 GTB",            make:"Ferrari",      model:"275 GTB",           era:"1960s",    flag:"🇮🇹", years:"1964–66", country:"Italy",  produced:"456",   surviving:"~400",  value:"£1.5M–£3.5M",  rarity:"legendary", hagerty:"ferrari/275_gtb/1965/1965-ferrari-275_gtb",
    desc:"Successor to the 250 GT. Independent rear suspension, five-speed transaxle. The twin-cam 275 GTB/4 is especially prized." },

  { name:"Ferrari 275 GTS",            make:"Ferrari",      model:"275 GTS",           era:"1960s",    flag:"🇮🇹", years:"1964–66", country:"Italy",  produced:"200",   surviving:"~170",  value:"£900K–£2M",    rarity:"legendary", hagerty:"ferrari/275_gts/1965/1965-ferrari-275_gts",
    desc:"The open version of the 275, bodied by Pininfarina. More restrained than the Berlinetta but exquisitely elegant. Rarer than the GTB." },

  { name:"Ferrari 330 GTC",            make:"Ferrari",      model:"330 GTC",           era:"1960s",    flag:"🇮🇹", years:"1966–68", country:"Italy",  produced:"598",   surviving:"~500",  value:"£500K–£1.2M",  rarity:"epic",      hagerty:"ferrari/330_gtc/1967/1967-ferrari-330_gtc",
    desc:"A 300bhp V12 in a beautifully resolved Pininfarina body. Often overlooked in favour of more exotic Ferraris but utterly satisfying." },

  { name:"Ferrari 365 GTB/4 Daytona",  make:"Ferrari",      model:"365 GTB/4",         era:"1960s",    flag:"🇮🇹", years:"1968–73", country:"Italy",  produced:"1,383", surviving:"~1,200",value:"£600K–£1.4M",  rarity:"epic",      hagerty:"ferrari/365_gtb!4/1971/1971-ferrari-365_gtb!4-daytona",
    desc:"The last front-engined Ferrari supercar of its era. 174mph. Named Daytona by the press after Ferrari's 1-2-3 at the 1967 24 Hours. Magnificent." },

  { name:"Lamborghini 350GT",          make:"Lamborghini",  model:"350GT",             era:"1960s",    flag:"🇮🇹", years:"1964–67", country:"Italy",  produced:"143",   surviving:"~120",  value:"£400K–£900K",  rarity:"epic",      hagerty:"lamborghini/350gt/1965/1965-lamborghini-350gt",
    desc:"The car that started Lamborghini. Bizzarrini-designed V12, Touring body. Built specifically to outshine Ferrari's road cars." },

  { name:"Lamborghini Miura P400",     make:"Lamborghini",  model:"Miura P400",        era:"1960s",    flag:"🇮🇹", years:"1966–69", country:"Italy",  produced:"275",   surviving:"~220",  value:"£1.2M–£2.5M",  rarity:"legendary", hagerty:"lamborghini/miura/1967/1967-lamborghini-miura_p400",
    desc:"Considered the world's first supercar. Mid-mounted transverse V12. Bertone body by Marcello Gandini. Beyond beautiful." },

  { name:"Lamborghini Miura SV",       make:"Lamborghini",  model:"Miura SV",          era:"1960s",    flag:"🇮🇹", years:"1971–72", country:"Italy",  produced:"150",   surviving:"~130",  value:"£2M–£4M",      rarity:"legendary", hagerty:"lamborghini/miura/1971/1971-lamborghini-miura_sv",
    desc:"The ultimate Miura. Wider arches, separate lubrication for gearbox and engine, improved handling. The definitive version." },

  { name:"Lamborghini Islero",         make:"Lamborghini",  model:"Islero",            era:"1960s",    flag:"🇮🇹", years:"1968–69", country:"Italy",  produced:"225",   surviving:"~150",  value:"£200K–£500K",  rarity:"epic",      hagerty:"lamborghini/islero/1968/1968-lamborghini-islero",
    desc:"Marazzi-styled 2+2 gran turismo. Less dramatic than the Miura but rewarding to drive. Often overlooked — and therefore undervalued." },

  { name:"Porsche 911 2.0 Coupé",      make:"Porsche",      model:"911",               era:"1960s",    flag:"🇩🇪", years:"1964–69", country:"Germany",produced:"~13,000",surviving:"~4,000",value:"£150K–£400K",  rarity:"epic",      hagerty:"porsche/911/1966/1966-porsche-911",
    desc:"The first 911. Air-cooled flat-six, torsion bar suspension. Transformed sports car handling expectations. Values rising sharply." },

  { name:"Porsche 911 S 2.2",          make:"Porsche",      model:"911 S",             era:"1960s",    flag:"🇩🇪", years:"1969–71", country:"Germany",produced:"~4,700", surviving:"~2,000",value:"£100K–£300K",  rarity:"epic",      hagerty:"porsche/911/1970/1970-porsche-911-s",
    desc:"The short-wheelbase 'S' with Fuchs alloy wheels. 180bhp, firmer suspension, faster. The driver's choice of early 911." },

  { name:"Porsche 911 R",              make:"Porsche",      model:"911 R",             era:"1960s",    flag:"🇩🇪", years:"1967–68", country:"Germany",produced:"20",    surviving:"20",    value:"£2M–£5M",      rarity:"legendary", hagerty:"porsche/911_r/1967/1967-porsche-911_r",
    desc:"Just 20 built for homologation. Lightweight fibreglass panels, stripped interior. A direct ancestor of the modern 911 R." },

  { name:"Porsche 904 Carrera GTS",    make:"Porsche",      model:"904",               era:"1960s",    flag:"🇩🇪", years:"1964",    country:"Germany",produced:"106",   surviving:"~90",   value:"£1.5M–£3.5M",  rarity:"legendary", hagerty:"porsche/904/1964/1964-porsche-904",
    desc:"A road-legal racing car. Fibreglass body bonded to a steel chassis. Won its class at Le Mans and the Targa Florio. Remarkably civilised." },

  { name:"Ford GT40 Mk1",              make:"Ford",         model:"GT40",              era:"1960s",    flag:"🇺🇸", years:"1964–68", country:"USA",    produced:"87",    surviving:"~75",   value:"£3M–£8M",      rarity:"legendary", hagerty:"ford/gt40/1966/1966-ford-gt40",
    desc:"Built to beat Ferrari at Le Mans. Won four consecutive times 1966–69. The epic 1966 finish had three GT40s cross the line together." },

  { name:"Ford Mustang 1st Gen Fastback",make:"Ford",       model:"Mustang",           era:"1960s",    flag:"🇺🇸", years:"1965–68", country:"USA",    produced:"472,121",surviving:"~80,000",value:"£25K–£80K",   rarity:"common",    hagerty:"ford/mustang/1966/1966-ford-mustang",
    desc:"The original pony car. The fastback body is the most desired. Steve McQueen's Highland Green Bullitt made it immortal." },

  { name:"Ford Mustang Shelby GT500",  make:"Ford",         model:"Mustang Shelby GT500",era:"1960s",  flag:"🇺🇸", years:"1967–70", country:"USA",    produced:"~15,000",surviving:"~8,000",value:"£80K–£200K",  rarity:"rare",      hagerty:"ford/mustang/1968/1968-ford-mustang-shelby_gt500",
    desc:"Carroll Shelby's muscle Mustang with a 428 Police Interceptor V8. Brutal, fast, American. Makes no apologies whatsoever." },

  { name:"AC Cobra 427",               make:"AC",           model:"Cobra 427",         era:"1960s",    flag:"🇬🇧", years:"1965–67", country:"UK",     produced:"~356",  surviving:"~300",  value:"£600K–£1.5M",  rarity:"epic",      hagerty:"ac/cobra/1966/1966-ac-cobra-427",
    desc:"A 7-litre Ford V8 in a delicate British sports car. 0-60 in 4.2 seconds in 1965. A terrifying, intoxicating machine." },

  { name:"Mini Cooper S Mk1",          make:"Mini",         model:"Cooper S",          era:"1960s",    flag:"🇬🇧", years:"1963–67", country:"UK",     produced:"~19,000",surviving:"~5,000",value:"£30K–£80K",   rarity:"rare",      hagerty:"mini/cooper_s/1965/1965-mini-cooper_s",
    desc:"Won the Monte Carlo Rally three times. Alec Issigonis's genius touched with John Cooper's performance know-how. Astonishing handling." },

  { name:"Lotus Elan S1",              make:"Lotus",        model:"Elan S1",           era:"1960s",    flag:"🇬🇧", years:"1962–65", country:"UK",     produced:"~1,000",surviving:"~600",  value:"£25K–£60K",    rarity:"rare",      hagerty:"lotus/elan/1963/1963-lotus-elan",
    desc:"Colin Chapman's brilliant Formula One thinking applied to a road car. Backbone chassis, twin-cam Ford engine. Benchmark handling." },

  { name:"Lotus Elan S4",              make:"Lotus",        model:"Elan S4",           era:"1960s",    flag:"🇬🇧", years:"1968–71", country:"UK",     produced:"~3,000",surviving:"~1,800",value:"£20K–£50K",    rarity:"rare",      hagerty:"lotus/elan/1969/1969-lotus-elan",
    desc:"The most refined of the original Elans. Sprint version produces 126bhp from the twin-cam Ford. Featherweight at under 700kg." },

  { name:"Lotus Europa S1",            make:"Lotus",        model:"Europa",            era:"1960s",    flag:"🇬🇧", years:"1966–68", country:"UK",     produced:"~660",  surviving:"~400",  value:"£20K–£45K",    rarity:"rare",      hagerty:"lotus/europa/1967/1967-lotus-europa",
    desc:"The first mid-engined Lotus road car. Designed to the same Formula 1 principles. Renault engine, bonded fibreglass body. Unique." },

  { name:"Maserati Ghibli",            make:"Maserati",     model:"Ghibli",            era:"1960s",    flag:"🇮🇹", years:"1966–73", country:"Italy",  produced:"1,149", surviving:"~800",  value:"£150K–£400K",  rarity:"epic",      hagerty:"maserati/ghibli/1969/1969-maserati-ghibli",
    desc:"Giugiaro's masterpiece before Giugiaro was famous. A 330bhp quad-cam V8 in a body of staggering beauty. The 'poor man's Ferrari'." },

  { name:"Alfa Romeo Giulia Sprint GTA",make:"Alfa Romeo",  model:"Giulia Sprint GTA", era:"1960s",    flag:"🇮🇹", years:"1965–69", country:"Italy",  produced:"500",   surviving:"~350",  value:"£200K–£600K",  rarity:"epic",      hagerty:"alfa_romeo/giulia/1966/1966-alfa_romeo-giulia-sprint_gta",
    desc:"Aluminium-bodied homologation special. Won countless touring car races across Europe. A twin-cam jewel that sounds extraordinary." },

  { name:"Alfa Romeo Giulia TI Super", make:"Alfa Romeo",   model:"Giulia TI Super",   era:"1960s",    flag:"🇮🇹", years:"1963–64", country:"Italy",  produced:"501",   surviving:"~200",  value:"£100K–£300K",  rarity:"epic",      hagerty:"alfa_romeo/giulia/1963/1963-alfa_romeo-giulia_ti_super",
    desc:"Built purely for homologation. Twin dual-choke Webers, lightweight panels, Plexiglas windows. A proper Italian racing saloon." },

  { name:"BMW 2002 Turbo",             make:"BMW",          model:"2002 Turbo",        era:"1960s",    flag:"🇩🇪", years:"1973–74", country:"Germany",produced:"1,672", surviving:"~600",  value:"£100K–£250K",  rarity:"epic",      hagerty:"bmw/2002_turbo/1974/1974-bmw-2002_turbo",
    desc:"Europe's first turbocharged production car. Mirror-image 'turbo' script on the front spoiler. Fierce power delivery. True landmark." },

  { name:"BMW 2002tii",                make:"BMW",          model:"2002tii",           era:"1960s",    flag:"🇩🇪", years:"1971–75", country:"Germany",produced:"38,703",surviving:"~12,000",value:"£25K–£60K",   rarity:"rare",      hagerty:"bmw/2002/1972/1972-bmw-2002tii",
    desc:"Fuel-injected 2002 with Kugelfischer mechanical injection. 130bhp, superb handling. The benchmark affordable sports saloon." },

  { name:"Jensen Interceptor Mk1",     make:"Jensen",       model:"Interceptor",       era:"1960s",    flag:"🇬🇧", years:"1966–71", country:"UK",     produced:"~1,800",surviving:"~1,200",value:"£50K–£130K",   rarity:"rare",      hagerty:"jensen/interceptor/1968/1968-jensen-interceptor",
    desc:"Vignale-styled body, Chrysler V8 engine. An Anglo-American grand tourer of effortless performance. Now enjoying a massive revival." },

  { name:"De Tomaso Mangusta",         make:"De Tomaso",    model:"Mangusta",          era:"1960s",    flag:"🇮🇹", years:"1967–71", country:"Italy",  produced:"401",   surviving:"~300",  value:"£200K–£500K",  rarity:"epic",      hagerty:"de_tomaso/mangusta/1969/1969-de_tomaso-mangusta",
    desc:"Giugiaro body, Ford V8 engine. The name means 'mongoose' — the natural predator of the cobra. Dramatic gull-wing engine covers." },

  // ─── 70s–80s ─────────────────────────────────────────────────────────────

  { name:"Lamborghini Countach LP400", make:"Lamborghini",  model:"Countach LP400",    era:"70s–80s",  flag:"🇮🇹", years:"1974–78", country:"Italy",  produced:"150",   surviving:"~120",  value:"£600K–£1.5M",  rarity:"legendary", hagerty:"lamborghini/countach/1975/1975-lamborghini-countach_lp400",
    desc:"The original Countach — Bertone/Gandini's pure vision before the wings and scoops arrived. The cleanest and most beautiful version." },

  { name:"Lamborghini Countach LP500S",make:"Lamborghini",  model:"Countach LP500S",   era:"70s–80s",  flag:"🇮🇹", years:"1982–85", country:"Italy",  produced:"323",   surviving:"~280",  value:"£500K–£1.2M",  rarity:"epic",      hagerty:"lamborghini/countach/1984/1984-lamborghini-countach_lp500s",
    desc:"The widened arches, NACA ducts, and rear wing define the classic Countach poster image. Outrageous, extreme, unforgettable." },

  { name:"Lamborghini Countach 25th Anniversary",make:"Lamborghini",model:"Countach 25th",era:"70s–80s",flag:"🇮🇹",years:"1988–90",country:"Italy",produced:"657",surviving:"~600",value:"£400K–£900K",rarity:"epic",hagerty:"lamborghini/countach/1989/1989-lamborghini-countach-25th_anniversary",
    desc:"Horacio Pagani redesigned the bodywork for the final Countach. Controversial at the time, now seen as the quintessential example." },

  { name:"Lamborghini Urraco P250",    make:"Lamborghini",  model:"Urraco",            era:"70s–80s",  flag:"🇮🇹", years:"1972–76", country:"Italy",  produced:"520",   surviving:"~300",  value:"£60K–£150K",   rarity:"rare",      hagerty:"lamborghini/urraco/1974/1974-lamborghini-urraco_p250",
    desc:"Bertone-styled baby Lambo with a mid-mounted V8. Intended to take on the Ferrari Dino but suffered reliability issues. Now charming." },

  { name:"Ferrari 308 GTB",            make:"Ferrari",      model:"308 GTB",           era:"70s–80s",  flag:"🇮🇹", years:"1975–80", country:"Italy",  produced:"2,897", surviving:"~2,500",value:"£70K–£140K",   rarity:"rare",      hagerty:"ferrari/308_gtb/1977/1977-ferrari-308_gtb",
    desc:"Pininfarina's masterpiece. The early fibreglass-bodied cars are rare and prized. V8 sounds extraordinary. Magnum P.I. made it famous." },

  { name:"Ferrari 308 GTS",            make:"Ferrari",      model:"308 GTS",           era:"70s–80s",  flag:"🇮🇹", years:"1977–85", country:"Italy",  produced:"3,219", surviving:"~2,800",value:"£60K–£120K",   rarity:"rare",      hagerty:"ferrari/308_gts/1979/1979-ferrari-308_gts",
    desc:"The targa-top 308 — as seen on Magnum P.I. The open roof transforms the experience. One of the most usable classic Ferraris." },

  { name:"Ferrari 328 GTB",            make:"Ferrari",      model:"328 GTB",           era:"70s–80s",  flag:"🇮🇹", years:"1985–89", country:"Italy",  produced:"1,344", surviving:"~1,200",value:"£80K–£160K",   rarity:"rare",      hagerty:"ferrari/328_gtb/1987/1987-ferrari-328_gtb",
    desc:"The refined evolution of the 308. Larger engine, improved injection, better reliability. Now achieving serious collector prices." },

  { name:"Ferrari 328 GTS",            make:"Ferrari",      model:"328 GTS",           era:"70s–80s",  flag:"🇮🇹", years:"1985–89", country:"Italy",  produced:"6,068", surviving:"~5,500",value:"£70K–£140K",   rarity:"rare",      hagerty:"ferrari/328_gts/1987/1987-ferrari-328_gts",
    desc:"More common than the GTB but equally desirable. The open roof and lovely V8 soundtrack make this a superb driving Ferrari." },

  { name:"Ferrari 512 BB",             make:"Ferrari",      model:"512 BB",            era:"70s–80s",  flag:"🇮🇹", years:"1976–84", country:"Italy",  produced:"929",   surviving:"~800",  value:"£300K–£600K",  rarity:"epic",      hagerty:"ferrari/512_bb/1979/1979-ferrari-512_bb",
    desc:"Flat-12 Berlinetta Boxer. Mid-engined successor to the Daytona. Ground-breaking, gorgeous, and sounds unlike any other Ferrari." },

  { name:"Ferrari 400 GT",             make:"Ferrari",      model:"400 GT",            era:"70s–80s",  flag:"🇮🇹", years:"1976–85", country:"Italy",  produced:"502",   surviving:"~420",  value:"£60K–£140K",   rarity:"rare",      hagerty:"ferrari/400/1979/1979-ferrari-400-gt",
    desc:"Ferrari's automatic grand tourer with a 4.8-litre V12. Long, elegant Pininfarina 2+2. Underrated and increasingly appreciated." },

  { name:"Ferrari Mondial",            make:"Ferrari",      model:"Mondial",           era:"70s–80s",  flag:"🇮🇹", years:"1980–93", country:"Italy",  produced:"6,789", surviving:"~5,000",value:"£30K–£70K",    rarity:"common",    hagerty:"ferrari/mondial/1984/1984-ferrari-mondial_8",
    desc:"Ferrari's only 2+2 mid-engined car. Often dismissed but the QV version is capable and practical. The best-value Ferrari to own and use." },

  { name:"Porsche 911 Turbo 3.3 (930)",make:"Porsche",     model:"911 Turbo",         era:"70s–80s",  flag:"🇩🇪", years:"1978–89", country:"Germany",produced:"~11,000",surviving:"~7,000",value:"£120K–£280K",  rarity:"epic",      hagerty:"porsche/911_turbo/1979/1979-porsche-911_turbo",
    desc:"The 'Widowmaker'. Massive turbo lag, no ABS, rear-engined. Terrifying in the wrong hands. Magnificent in the right ones." },

  { name:"Porsche 944",                make:"Porsche",      model:"944",               era:"70s–80s",  flag:"🇩🇪", years:"1982–91", country:"Germany",produced:"163,422",surviving:"~50,000",value:"£10K–£35K",   rarity:"common",    hagerty:"porsche/944/1985/1985-porsche-944",
    desc:"Balanced 50:50 weight distribution, proper four-cylinder. The best-handling Porsche of its era by many accounts. Surging in value." },

  { name:"Porsche 944 Turbo",          make:"Porsche",      model:"944 Turbo",         era:"70s–80s",  flag:"🇩🇪", years:"1985–91", country:"Germany",produced:"25,245",surviving:"~10,000",value:"£25K–£65K",   rarity:"rare",      hagerty:"porsche/944_turbo/1986/1986-porsche-944_turbo",
    desc:"250bhp from the turbocharged 2.5-litre. One of the fastest cars of its era at any price. Superior build and driving dynamics." },

  { name:"Porsche 959",                make:"Porsche",      model:"959",               era:"70s–80s",  flag:"🇩🇪", years:"1986–89", country:"Germany",produced:"337",   surviving:"~310",  value:"£1.5M–£3.5M",  rarity:"legendary", hagerty:"porsche/959/1987/1987-porsche-959",
    desc:"The most advanced road car of its era. AWD, twin-turbo, ceramic brakes. Beaten the ring but ultimately proved unbeatable as a technology showcase." },

  { name:"Porsche 993 911 Carrera",    make:"Porsche",      model:"993 Carrera",       era:"70s–80s",  flag:"🇩🇪", years:"1993–98", country:"Germany",produced:"~68,000",surviving:"~45,000",value:"£60K–£120K",  rarity:"rare",      hagerty:"porsche/993/1995/1995-porsche-993-carrera",
    desc:"The last air-cooled 911. Considered by many Porsche enthusiasts to be the purest 911 ever made. Values rising steadily." },

  { name:"Porsche 993 GT2",            make:"Porsche",      model:"993 GT2",           era:"70s–80s",  flag:"🇩🇪", years:"1995–97", country:"Germany",produced:"194",   surviving:"~170",  value:"£1M–£2.5M",    rarity:"legendary", hagerty:"porsche/993/1996/1996-porsche-993-gt2",
    desc:"The most extreme air-cooled 911. 430bhp twin-turbo, no traction control, rear-drive only. Ferociously fast and deeply serious." },

  { name:"Porsche 993 Turbo",          make:"Porsche",      model:"993 Turbo",         era:"70s–80s",  flag:"🇩🇪", years:"1995–98", country:"Germany",produced:"~5,978",surviving:"~4,500",value:"£150K–£320K",  rarity:"epic",      hagerty:"porsche/993/1996/1996-porsche-993-turbo",
    desc:"AWD, twin-turbo, flared arches. The 993 Turbo is everything the 930 was, but manageable. One of the great driver's cars." },

  { name:"Ford Sierra RS Cosworth",    make:"Ford",         model:"Sierra RS Cosworth",era:"70s–80s",  flag:"🇬🇧", years:"1986–87", country:"UK",     produced:"5,545", surviving:"~1,500",value:"£50K–£120K",   rarity:"rare",      hagerty:"ford/sierra_rs_cosworth/1987/1987-ford-sierra_rs_cosworth",
    desc:"The whale-tail homologation special. 204bhp turbocharged Cosworth engine. Won the British and European Touring Car Championship." },

  { name:"Ford Sierra RS500 Cosworth", make:"Ford",         model:"Sierra RS500",      era:"70s–80s",  flag:"🇬🇧", years:"1987",    country:"UK",     produced:"500",   surviving:"~250",  value:"£100K–£280K",  rarity:"epic",      hagerty:"ford/sierra_rs500_cosworth/1987/1987-ford-sierra_rs500_cosworth",
    desc:"The ultimate RS Cosworth. Extra injectors, larger intercooler. Built purely for racing homologation. Dominated ETCC." },

  { name:"Ford Escort Mk1 RS1600",     make:"Ford",         model:"Escort RS1600",     era:"70s–80s",  flag:"🇬🇧", years:"1970–75", country:"UK",     produced:"~1,100",surviving:"~600",  value:"£50K–£120K",   rarity:"rare",      hagerty:"ford/escort/1971/1971-ford-escort-rs1600",
    desc:"The BDA-engined homologation special. Won the RAC Rally with Roger Clark. The beginning of Ford's RS legend." },

  { name:"Ford Escort Mk2 RS2000",     make:"Ford",         model:"Escort RS2000",     era:"70s–80s",  flag:"🇬🇧", years:"1976–80", country:"UK",     produced:"~11,000",surviving:"~4,000",value:"£18K–£45K",   rarity:"rare",      hagerty:"ford/escort/1977/1977-ford-escort-rs2000",
    desc:"The most desirable Mk2 Escort. Droop-snoot nose, Pinto 2.0-litre engine. A rally car for the road that's properly fun to drive." },

  { name:"Ford Escort Mk1 Mexico",     make:"Ford",         model:"Escort Mexico",     era:"70s–80s",  flag:"🇬🇧", years:"1970–74", country:"UK",     produced:"~10,000",surviving:"~3,500",value:"£20K–£55K",   rarity:"rare",      hagerty:"ford/escort/1971/1971-ford-escort-mexico",
    desc:"Named after Hannu Mikkola's London-Mexico World Cup Rally win. The push-rod 1600 GT engine in a lightweight shell. Great fun." },

  { name:"Ford Fiesta Mk1 XR2",        make:"Ford",         model:"Fiesta XR2",        era:"70s–80s",  flag:"🇬🇧", years:"1981–84", country:"UK",     produced:"~30,000",surviving:"~1,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"ford/fiesta/1983/1983-ford-fiesta-xr2",
    desc:"The original hot Fiesta. Sporty but ultimately more style than substance — though that's precisely why everyone adored it." },

  { name:"BMW E30 M3",                 make:"BMW",          model:"M3 E30",            era:"70s–80s",  flag:"🇩🇪", years:"1986–91", country:"Germany",produced:"17,184",surviving:"~8,000",value:"£80K–£200K",   rarity:"rare",      hagerty:"bmw/m3/1988/1988-bmw-m3",
    desc:"The homologation special that defined the sports saloon. High-revving four-cylinder, perfect handling. Won DTM and ETCC." },

  { name:"BMW E28 M5",                 make:"BMW",          model:"M5 E28",            era:"70s–80s",  flag:"🇩🇪", years:"1984–88", country:"Germany",produced:"2,191", surviving:"~1,200",value:"£50K–£130K",   rarity:"rare",      hagerty:"bmw/m5/1987/1987-bmw-m5",
    desc:"The world's fastest saloon on launch. M1 engine in a 5-series body. Hand-built by M GmbH. The original super-saloon." },

  { name:"BMW M1",                     make:"BMW",          model:"M1",                era:"70s–80s",  flag:"🇩🇪", years:"1978–81", country:"Germany",produced:"453",   surviving:"~400",  value:"£500K–£1M",    rarity:"epic",      hagerty:"bmw/m1/1980/1980-bmw-m1",
    desc:"BMW's only mid-engined production car. Designed by Giugiaro, engineered with Lamborghini. Raced in the spectacular Procar series." },

  { name:"De Lorean DMC-12",           make:"De Lorean",    model:"DMC-12",            era:"70s–80s",  flag:"🇺🇸", years:"1981–83", country:"USA",    produced:"8,583", surviving:"~6,500",value:"£30K–£70K",    rarity:"rare",      hagerty:"de_lorean/dmc~12/1982/1982-de_lorean-dmc~12",
    desc:"Gullwing doors, stainless steel body, Giugiaro design. Underpowered but unforgettable. Back to the Future made it immortal." },

  { name:"Rover SD1 Vitesse",          make:"Rover",        model:"SD1 Vitesse",       era:"70s–80s",  flag:"🇬🇧", years:"1982–86", country:"UK",     produced:"~4,500",surviving:"~1,500",value:"£15K–£45K",   rarity:"rare",      hagerty:"rover/sd1/1984/1984-rover-sd1-vitesse",
    desc:"190bhp Rover V8, Ferrari Daytona-inspired hatchback styling. European Car of the Year in 1977. Won the BTCC outright." },

  { name:"MG Metro 6R4",               make:"MG",           model:"Metro 6R4",         era:"70s–80s",  flag:"🇬🇧", years:"1984–86", country:"UK",     produced:"200",   surviving:"~180",  value:"£250K–£600K",  rarity:"epic",      hagerty:"mg/metro_6r4/1985/1985-mg-metro_6r4",
    desc:"Mid-engined, 4WD, 3-litre V6. A Group B rally car that never needed to be road-legal but was. Astonishing piece of engineering." },

  { name:"Austin Metro Turbo",         make:"Austin",       model:"Metro Turbo",       era:"70s–80s",  flag:"🇬🇧", years:"1983–90", country:"UK",     produced:"~20,000",surviving:"~500",  value:"£8K–£25K",    rarity:"rare",      hagerty:"",
    desc:"The turbocharged small hatchback. Hydragas suspension, sharp handling, nippy performance. Increasingly rare survivor." },

  { name:"Renault 5 Turbo",            make:"Renault",      model:"5 Turbo",           era:"70s–80s",  flag:"🇫🇷", years:"1980–86", country:"France", produced:"4,987", surviving:"~3,000",value:"£70K–£180K",   rarity:"rare",      hagerty:"renault/r5/1982/1982-renault-r5_turbo",
    desc:"Mid-engined turbo monster in a hot hatch body. Dominated rallying in 1981. Road versions are astonishing and bizarre." },

  { name:"Lancia Stratos",             make:"Lancia",       model:"Stratos",           era:"70s–80s",  flag:"🇮🇹", years:"1972–78", country:"Italy",  produced:"492",   surviving:"~400",  value:"£400K–£900K",  rarity:"legendary", hagerty:"lancia/stratos/1974/1974-lancia-stratos",
    desc:"Built purely to win the World Rally Championship. Won it three consecutive times 1974–76. Bertone wedge body, Ferrari Dino V6." },

  { name:"Lancia 037 Stradale",        make:"Lancia",       model:"037",               era:"70s–80s",  flag:"🇮🇹", years:"1982–83", country:"Italy",  produced:"207",   surviving:"~180",  value:"£400K–£900K",  rarity:"epic",      hagerty:"lancia/rally_037/1983/1983-lancia-rally_037",
    desc:"The last rear-wheel drive car to win a WRC title, in 1983. Supercharged Fiat 2-litre engine. Road car is pure race car." },

  { name:"Lotus Esprit S1",            make:"Lotus",        model:"Esprit S1",         era:"70s–80s",  flag:"🇬🇧", years:"1976–78", country:"UK",     produced:"~1,000",surviving:"~600",  value:"£40K–£90K",    rarity:"rare",      hagerty:"lotus/esprit/1977/1977-lotus-esprit",
    desc:"Giugiaro's razor-edge Esprit. James Bond drove one into the sea in The Spy Who Loved Me. Fragile but magnificent." },

  { name:"Lotus Esprit Turbo",         make:"Lotus",        model:"Esprit Turbo",      era:"70s–80s",  flag:"🇬🇧", years:"1980–87", country:"UK",     produced:"~1,700",surviving:"~1,000",value:"£40K–£90K",    rarity:"rare",      hagerty:"lotus/esprit_turbo/1983/1983-lotus-esprit_turbo",
    desc:"The turbo transformed the Esprit. James Bond drove one in For Your Eyes Only. 210bhp from the Lotus 2.2-litre four-cylinder." },

  { name:"Lotus Carlton",              make:"Lotus",        model:"Carlton",           era:"70s–80s",  flag:"🇬🇧", years:"1990–92", country:"UK",     produced:"950",   surviving:"~700",  value:"£50K–£120K",   rarity:"rare",      hagerty:"lotus/carlton/1991/1991-lotus-carlton",
    desc:"377bhp twin-turbo in a Vauxhall Carlton body. 176mph — the world's fastest saloon car in 1990. Caused a parliamentary scandal." },

  { name:"TVR 350i",                   make:"TVR",          model:"350i",              era:"70s–80s",  flag:"🇬🇧", years:"1983–89", country:"UK",     produced:"~1,800",surviving:"~800",  value:"£12K–£30K",    rarity:"rare",      hagerty:"tvr/350i/1984/1984-tvr-350i",
    desc:"Rover V8 in a fibreglass TVR body. Torquey and fast, with the handling challenge that defined the era. Affordable and entertaining." },

  { name:"TVR Tasmin 200",             make:"TVR",          model:"Tasmin 200",        era:"70s–80s",  flag:"🇬🇧", years:"1980–84", country:"UK",     produced:"~260",  surviving:"~150",  value:"£10K–£25K",    rarity:"rare",      hagerty:"tvr/tasmin/1981/1981-tvr-tasmin_200",
    desc:"TVR's first wedge-shaped car. A departure from the round-bodied Grantura series. Four-cylinder Pinto engine." },

  { name:"Aston Martin V8 Vantage",    make:"Aston Martin", model:"V8 Vantage",        era:"70s–80s",  flag:"🇬🇧", years:"1977–89", country:"UK",     produced:"~350",  surviving:"~280",  value:"£150K–£400K",  rarity:"epic",      hagerty:"aston_martin/v8_vantage/1985/1985-aston_martin-v8_vantage",
    desc:"The world's fastest production car when launched. Massive 375bhp V8 with a bonnet bulge to accommodate the carburettors. Brutal." },

  { name:"Aston Martin Lagonda",       make:"Aston Martin", model:"Lagonda",           era:"70s–80s",  flag:"🇬🇧", years:"1976–90", country:"UK",     produced:"645",   surviving:"~500",  value:"£50K–£130K",   rarity:"rare",      hagerty:"aston_martin/lagonda/1980/1980-aston_martin-lagonda",
    desc:"William Towns's extraordinary wedge saloon. Digital dashboard years ahead of its time. Utterly unique. A Marmite car — loved or loathed." },

  { name:"McLaren F1",                 make:"McLaren",      model:"F1",                era:"1990s",    flag:"🇬🇧", years:"1992–98", country:"UK",     produced:"106",   surviving:"~100",  value:"£15M–£25M",    rarity:"legendary", hagerty:"mclaren/f1/1994/1994-mclaren-f1",
    desc:"Gordon Murray's masterpiece. Centre-seat driving position, BMW V12, carbon fibre throughout. Set the production car speed record at 243mph." },

  // ─── 1990s ───────────────────────────────────────────────────────────────

  { name:"Ferrari F40",                make:"Ferrari",      model:"F40",               era:"1990s",    flag:"🇮🇹", years:"1987–92", country:"Italy",  produced:"1,311", surviving:"~1,200",value:"£1.8M–£3.5M",  rarity:"legendary", hagerty:"ferrari/f40/1991/1991-ferrari-f40",
    desc:"Enzo Ferrari's last car. No carpets, no radio, exposed carbon fibre. 201mph. The purest, most terrifying Ferrari road car ever made." },

  { name:"Ferrari F50",                make:"Ferrari",      model:"F50",               era:"1990s",    flag:"🇮🇹", years:"1995–97", country:"Italy",  produced:"349",   surviving:"~340",  value:"£3M–£6M",      rarity:"legendary", hagerty:"ferrari/f50/1996/1996-ferrari-f50",
    desc:"F1 technology in a road car. The V12 is mounted as a stressed member, like a Formula 1 car. Open-top driving at its most extreme." },

  { name:"Ferrari 456 GT",             make:"Ferrari",      model:"456 GT",            era:"1990s",    flag:"🇮🇹", years:"1992–2003",country:"Italy",  produced:"2,715", surviving:"~2,200",value:"£80K–£180K",   rarity:"rare",      hagerty:"ferrari/456_gt/1994/1994-ferrari-456_gt",
    desc:"The grand tourer that proved Ferrari could do 2+2 with style. 5.5-litre V12, Pininfarina body, six-speed manual. Devastatingly good." },

  { name:"Ferrari 550 Maranello",      make:"Ferrari",      model:"550 Maranello",     era:"1990s",    flag:"🇮🇹", years:"1996–2001",country:"Italy",  produced:"3,083", surviving:"~2,700",value:"£150K–£300K",  rarity:"epic",      hagerty:"ferrari/550_maranello/1998/1998-ferrari-550_maranello",
    desc:"Ferrari's triumphant return to front-engined V12. 485bhp, 199mph, and beautiful. The Barchetta version is exceptionally rare and valuable." },

  { name:"Ferrari 355 Berlinetta",     make:"Ferrari",      model:"355 Berlinetta",    era:"1990s",    flag:"🇮🇹", years:"1994–99", country:"Italy",  produced:"4,871", surviving:"~4,200",value:"£80K–£160K",   rarity:"rare",      hagerty:"ferrari/355/1995/1995-ferrari-355-berlinetta",
    desc:"The 355 perfected the mid-engined V8 formula. Five-valve per cylinder engine, flat-plane crank howl. Considered perfect by many." },

  { name:"Ferrari 355 Spider",         make:"Ferrari",      model:"355 Spider",        era:"1990s",    flag:"🇮🇹", years:"1995–99", country:"Italy",  produced:"3,717", surviving:"~3,200",value:"£80K–£170K",   rarity:"rare",      hagerty:"ferrari/355/1996/1996-ferrari-355-spider",
    desc:"The electric hood works in 14 seconds. Add an Italian morning and the V8 soundtrack and this is perhaps the ultimate Ferrari experience." },

  { name:"Jaguar XJ220",               make:"Jaguar",       model:"XJ220",             era:"1990s",    flag:"🇬🇧", years:"1992–94", country:"UK",     produced:"282",   surviving:"~270",  value:"£400K–£900K",  rarity:"legendary", hagerty:"jaguar/xj220/1993/1993-jaguar-xj220",
    desc:"Britain's fastest production car at 217mph. Twin-turbo V6 replaced the promised V12. Won its class at Le Mans. Hugely undervalued." },

  { name:"Jaguar XJR-S",               make:"Jaguar",       model:"XJR-S",             era:"1990s",    flag:"🇬🇧", years:"1988–93", country:"UK",     produced:"~800",  surviving:"~450",  value:"£25K–£60K",    rarity:"rare",      hagerty:"jaguar/xjr/1990/1990-jaguar-xjr_s",
    desc:"Tom Walkinshaw's 333bhp XJ12. Subtle bodykit, bespoke interior. The ultimate classic Jaguar saloon for the driver." },

  { name:"Honda NSX",                  make:"Honda",        model:"NSX",               era:"1990s",    flag:"🇯🇵", years:"1990–2005",country:"Japan",  produced:"18,515",surviving:"~12,000",value:"£60K–£150K",   rarity:"rare",      hagerty:"honda/nsx/1991/1991-honda-nsx",
    desc:"Ayrton Senna helped develop the suspension. An aluminium mid-engined V6 masterpiece. Proved Japan could build a world-class supercar." },

  { name:"Dodge Viper GTS",            make:"Dodge",        model:"Viper GTS",         era:"1990s",    flag:"🇺🇸", years:"1996–2002",country:"USA",    produced:"~5,500",surviving:"~4,500",value:"£45K–£100K",   rarity:"rare",      hagerty:"dodge/viper/1997/1997-dodge-viper-gts",
    desc:"8-litre V10 with no traction control, no ABS, and side exhausts. An American sports car of spectacular, dangerous excess." },

  { name:"Chevrolet Corvette C4 ZR1",  make:"Chevrolet",    model:"Corvette C4 ZR1",   era:"1990s",    flag:"🇺🇸", years:"1990–95", country:"USA",    produced:"6,939", surviving:"~5,500",value:"£25K–£65K",    rarity:"rare",      hagerty:"chevrolet/corvette/1991/1991-chevrolet-corvette-zr1",
    desc:"The King of the Hill. Lotus-developed LT5 V8 with 375bhp. Electronically limited to 180mph. America's most sophisticated sports car of the era." },

  { name:"BMW E36 M3",                 make:"BMW",          model:"M3 E36",            era:"1990s",    flag:"🇩🇪", years:"1992–99", country:"Germany",produced:"71,242",surviving:"~30,000",value:"£20K–£50K",    rarity:"common",    hagerty:"bmw/m3/1995/1995-bmw-m3",
    desc:"The E36 M3 brought M3 ownership within reach of many. The European 3.0-litre version with six-cylinder is now the most sought-after." },

  { name:"BMW E46 M3",                 make:"BMW",          model:"M3 E46",            era:"1990s",    flag:"🇩🇪", years:"2000–06", country:"Germany",produced:"85,766",surviving:"~40,000",value:"£25K–£60K",   rarity:"common",    hagerty:"bmw/m3/2002/2002-bmw-m3",
    desc:"The S54 straight-six is one of BMW's finest engines. The CSL version with carbon roof is among the greatest driver's cars." },

  { name:"BMW E34 M5",                 make:"BMW",          model:"M5 E34",            era:"1990s",    flag:"🇩🇪", years:"1988–95", country:"Germany",produced:"12,254",surviving:"~5,000",value:"£30K–£70K",    rarity:"rare",      hagerty:"bmw/m5/1991/1991-bmw-m5",
    desc:"The S38 straight-six with 340bhp. Tour de France dominant. The Touring estate version is particularly rare and sought-after." },

  { name:"Subaru Impreza WRX STi",     make:"Subaru",       model:"Impreza WRX STi",   era:"1990s",    flag:"🇯🇵", years:"1994–2001",country:"Japan",  produced:"~50,000",surviving:"~15,000",value:"£20K–£60K",   rarity:"rare",      hagerty:"subaru/impreza/1995/1995-subaru-impreza-wrx",
    desc:"Won the WRC in 1995, 1996, 1997. McRae and Burns cemented its legend. The GC8 generation is now a genuine modern classic." },

  { name:"Mitsubishi Lancer Evo 6 TME",make:"Mitsubishi",  model:"Evo VI Tommi Mäkinen",era:"1990s",  flag:"🇯🇵", years:"1999–2001",country:"Japan", produced:"~2,500",surviving:"~1,500",value:"£40K–£90K",   rarity:"rare",      hagerty:"mitsubishi/lancer_evolution/2000/2000-mitsubishi-lancer_evolution",
    desc:"The Tommi Mäkinen Edition. Named for the driver who won the WRC four consecutive times in a Lancer. The most driver-focused Evo." },

  { name:"Toyota Supra Mk4 Twin Turbo",make:"Toyota",      model:"Supra Mk4",         era:"1990s",    flag:"🇯🇵", years:"1993–2002",country:"Japan",  produced:"~14,000",surviving:"~8,000",value:"£60K–£180K",   rarity:"rare",      hagerty:"toyota/supra/1994/1994-toyota-supra",
    desc:"The 2JZ-GTE twin-turbo engine is legendary for its tuning potential. Driven by Brian O'Conner in Fast and Furious. Values exploded." },

  { name:"Nissan Skyline GT-R R33",    make:"Nissan",       model:"Skyline GT-R R33",  era:"1990s",    flag:"🇯🇵", years:"1995–98", country:"Japan",  produced:"~16,000",surviving:"~8,000",value:"£30K–£80K",    rarity:"rare",      hagerty:"nissan/skyline/1996/1996-nissan-skyline-gt~r",
    desc:"The RB26DETT twin-turbo straight-six with ATTESA AWD. Lapped the Nürburgring in 7:59, a sensation at the time. Underrated gem." },

  { name:"Nissan Skyline GT-R R34",    make:"Nissan",       model:"Skyline GT-R R34",  era:"1990s",    flag:"🇯🇵", years:"1999–2002",country:"Japan", produced:"~11,000",surviving:"~7,000",value:"£80K–£250K",   rarity:"rare",      hagerty:"nissan/skyline/1999/1999-nissan-skyline-gt~r_r34",
    desc:"The most technically advanced Skyline. V-Spec II is the definitive version. Gran Turismo and Fast & Furious made it a global icon." },

  { name:"Mazda RX-7 FD",              make:"Mazda",        model:"RX-7 FD",           era:"1990s",    flag:"🇯🇵", years:"1991–2002",country:"Japan", produced:"~68,000",surviving:"~25,000",value:"£20K–£60K",   rarity:"rare",      hagerty:"mazda/rx~7/1993/1993-mazda-rx~7",
    desc:"The twin-turbocharged rotary masterpiece. Achingly beautiful Mazda design. One of the best-handling cars of its era." },

  { name:"Bugatti EB110 GT",           make:"Bugatti",      model:"EB110 GT",          era:"1990s",    flag:"🇫🇷", years:"1991–95", country:"France", produced:"139",   surviving:"~120",  value:"£1.5M–£3M",    rarity:"legendary", hagerty:"bugatti/eb110/1992/1992-bugatti-eb110",
    desc:"The Bugatti revival. Quad-turbocharged V12, AWD, carbon fibre. Michael Schumacher owned one. Faster than the McLaren F1 to 60mph." },

  { name:"Renault Clio Williams",      make:"Renault",      model:"Clio Williams",     era:"1990s",    flag:"🇫🇷", years:"1993–96", country:"France", produced:"12,100",surviving:"~4,000",value:"£15K–£40K",    rarity:"rare",      hagerty:"renault/clio/1994/1994-renault-clio-williams",
    desc:"Homologation special built to let Renault compete in the Clio Cup. 150bhp 2.0-litre Williams-tuned engine in a small Clio. Delightful." },

  { name:"Renault Clio V6 Phase 1",    make:"Renault",      model:"Clio V6",           era:"1990s",    flag:"🇫🇷", years:"2001–03", country:"France", produced:"~1,500",surviving:"~1,000",value:"£25K–£55K",    rarity:"rare",      hagerty:"renault/clio/2001/2001-renault-clio-v6",
    desc:"A mid-mounted 3.0-litre V6 in a modified Clio body. Designed by TWR. Spectacular but genuinely challenging to drive quickly." },

  { name:"VW Golf Mk1 GTI 1.6",        make:"Volkswagen",   model:"Golf Mk1 GTI 1.6",  era:"1990s",    flag:"🇩🇪", years:"1976–82", country:"Germany",produced:"~462,000",surviving:"~20,000",value:"£20K–£55K",   rarity:"rare",      hagerty:"volkswagen/golf/1980/1980-volkswagen-golf-gti",
    desc:"The original hot hatch. 110bhp, bucket seats, red pinstripe trim. Defined an entirely new class of car. Increasingly rare survivors." },

  { name:"VW Golf Mk2 GTI 16v",        make:"Volkswagen",   model:"Golf Mk2 GTI 16v",  era:"1990s",    flag:"🇩🇪", years:"1985–92", country:"Germany",produced:"~100,000",surviving:"~20,000",value:"£15K–£40K",   rarity:"rare",      hagerty:"volkswagen/golf/1987/1987-volkswagen-golf-gti",
    desc:"The 16-valve head transforms the GTI. A genuinely quick, progressive, deeply satisfying hot hatch. The golf standard for decades." },

  { name:"VW Golf Mk2 G60 Rallye",     make:"Volkswagen",   model:"Golf Rallye G60",   era:"1990s",    flag:"🇩🇪", years:"1989–91", country:"Germany",produced:"5,000", surviving:"~2,000",value:"£25K–£70K",    rarity:"rare",      hagerty:"volkswagen/golf_rallye/1989/1989-volkswagen-golf_rallye",
    desc:"Wide-arch homologation special with G60 supercharger and Syncro 4WD. Rare, purposeful, and increasingly collectable." },

  { name:"TVR Cerbera 4.2",            make:"TVR",          model:"Cerbera 4.2",       era:"1990s",    flag:"🇬🇧", years:"1996–2003",country:"UK",    produced:"~1,500",surviving:"~800",  value:"£20K–£55K",    rarity:"rare",      hagerty:"tvr/cerbera/1997/1997-tvr-cerbera",
    desc:"TVR's grand tourer. Their own AJP V8 engine, proper 2+2 seating. No ABS, no traction control, no power steering. Glorious." },

  { name:"TVR Griffith 500",           make:"TVR",          model:"Griffith 500",      era:"1990s",    flag:"🇬🇧", years:"1992–2002",country:"UK",    produced:"~2,200",surviving:"~1,200",value:"£20K–£55K",    rarity:"rare",      hagerty:"tvr/griffith/1994/1994-tvr-griffith",
    desc:"Rover V8, 280bhp, no driver aids. Pure, howling, sideways British sports car. The last of a breed and better for it." },

  { name:"TVR Chimaera",               make:"TVR",          model:"Chimaera",          era:"1990s",    flag:"🇬🇧", years:"1992–2003",country:"UK",    produced:"~5,800",surviving:"~3,000",value:"£15K–£40K",    rarity:"rare",      hagerty:"tvr/chimaera/1995/1995-tvr-chimaera",
    desc:"TVR's best-selling car. Rover V8 variants from 240-320bhp. More refined than the Griffith, nearly as fast, deeply loveable." },

  { name:"Alfa Romeo 155 GTA",         make:"Alfa Romeo",   model:"155 GTA",           era:"1990s",    flag:"🇮🇹", years:"1996",    country:"Italy",  produced:"~156",  surviving:"~100",  value:"£60K–£150K",   rarity:"rare",      hagerty:"",
    desc:"Homologation special for Super Touring. Twin-cam 2.5-litre V6, uprated suspension, limited-slip differential. Road-car racer." },

  { name:"Alfa Romeo GTV V6",          make:"Alfa Romeo",   model:"GTV V6",            era:"1990s",    flag:"🇮🇹", years:"1994–2006",country:"Italy",  produced:"~40,000",surviving:"~10,000",value:"£10K–£30K",  rarity:"common",    hagerty:"alfa_romeo/gtv/1996/1996-alfa_romeo-gtv",
    desc:"Pininfarina-designed 2+2 with the Busso V6. One of the last truly passionate Italian sports cars at an accessible price." },

  { name:"Alfa Romeo Spider 916",      make:"Alfa Romeo",   model:"Spider 916",        era:"1990s",    flag:"🇮🇹", years:"1994–2005",country:"Italy",  produced:"~30,000",surviving:"~10,000",value:"£8K–£25K",   rarity:"common",    hagerty:"alfa_romeo/spider/1997/1997-alfa_romeo-spider",
    desc:"A proper soft-top Italian sports car with the Busso V6. Later cars with electronic hood and V6 power are the sweet spot." },

  { name:"Aston Martin DB7",           make:"Aston Martin", model:"DB7",               era:"1990s",    flag:"🇬🇧", years:"1994–2004",country:"UK",    produced:"7,100", surviving:"~5,000",value:"£30K–£80K",    rarity:"rare",      hagerty:"aston_martin/db7/1995/1995-aston_martin-db7",
    desc:"Saved Aston Martin. Ian Callum's beautiful body on a modified Jaguar XJ-S platform. The Vantage Zagato is magnificently rare." },

  { name:"Aston Martin V8 Vantage Le Mans",make:"Aston Martin",model:"V8 Vantage Le Mans",era:"1990s",flag:"🇬🇧",years:"1999",country:"UK",produced:"40",surviving:"40",value:"£300K–£700K",rarity:"legendary",hagerty:"aston_martin/v8_vantage/1999/1999-aston_martin-v8_vantage",
    desc:"The final 550bhp twin-supercharged version of the classic V8 Vantage. Built to celebrate the Le Mans GT victory. Only 40 made." },

  { name:"Porsche 993 RS",             make:"Porsche",      model:"993 RS",            era:"1990s",    flag:"🇩🇪", years:"1995–96", country:"Germany",produced:"1,014", surviving:"~900",  value:"£300K–£700K",  rarity:"legendary", hagerty:"porsche/993/1995/1995-porsche-993-rs",
    desc:"The pure driver's 911. Wider arches, lowered suspension, stripped interior. The last air-cooled RS — values have gone stratospheric." },

  { name:"Porsche 996 GT3",            make:"Porsche",      model:"996 GT3",           era:"1990s",    flag:"🇩🇪", years:"1999–2001",country:"Germany",produced:"~1,900",surviving:"~1,500",value:"£60K–£120K",  rarity:"rare",      hagerty:"porsche/996/2000/2000-porsche-996-gt3",
    desc:"The first GT3. Metzger engine, firmer suspension, the racing experience you could drive to the circuit. The modern purist's 911." },

  { name:"Porsche 996 Turbo",          make:"Porsche",      model:"996 Turbo",         era:"1990s",    flag:"🇩🇪", years:"2000–05", country:"Germany",produced:"~13,000",surviving:"~9,000",value:"£40K–£80K",   rarity:"rare",      hagerty:"porsche/996/2001/2001-porsche-996-turbo",
    desc:"420bhp twin-turbo, AWD, and the Mezger engine. Despite the water-cooling controversy, the 996 Turbo is ferociously capable." },

  { name:"Lotus Elise S1",             make:"Lotus",        model:"Elise S1",          era:"1990s",    flag:"🇬🇧", years:"1996–2001",country:"UK",    produced:"~2,900",surviving:"~2,000",value:"£20K–£45K",    rarity:"rare",      hagerty:"lotus/elise/1997/1997-lotus-elise",
    desc:"Chapman's philosophy reborn. Extruded aluminium chassis, rover K-series engine, 725kg. The most connected sports car of its era." },

  { name:"Lotus Exige S1",             make:"Lotus",        model:"Exige S1",          era:"1990s",    flag:"🇬🇧", years:"2000–01", country:"UK",     produced:"~615",  surviving:"~450",  value:"£30K–£65K",    rarity:"rare",      hagerty:"lotus/exige/2000/2000-lotus-exige",
    desc:"The Elise with a fixed-roof fibreglass hardtop and rear spoiler. Stiffened further, even more focused. A tiny, brilliant driver's car." },

  { name:"Noble M12 GTO",              make:"Noble",        model:"M12 GTO",           era:"1990s",    flag:"🇬🇧", years:"2000–06", country:"UK",     produced:"~450",  surviving:"~350",  value:"£25K–£60K",    rarity:"rare",      hagerty:"noble/m12/2001/2001-noble-m12",
    desc:"Mid-engined Ford V6 turbo, lightweight composite body. Better than the Porsche GT3 on track for a fraction of the price, they said." },


// ─── PRE-WAR additions ───────────────────────────────────────────────────────

  { name:"Rolls-Royce Phantom III",    make:"Rolls-Royce",  model:"Phantom III",       era:"Pre-War",  flag:"🇬🇧", years:"1936–39", country:"UK",     produced:"727",   surviving:"~500",  value:"£200K–£700K",  rarity:"epic",      hagerty:"rolls~royce/phantom_iii/1937/1937-rolls~royce-phantom_iii",
    desc:"The only Rolls-Royce to use a V12 engine in the pre-war era. Enormously complex, but the pinnacle of 1930s engineering extravagance." },

  { name:"Delahaye 135M",              make:"Delahaye",     model:"135M",              era:"Pre-War",  flag:"🇫🇷", years:"1936–54", country:"France", produced:"~800",  surviving:"~300",  value:"£200K–£700K",  rarity:"epic",      hagerty:"delahaye/135m/1939/1939-delahaye-135m",
    desc:"The grande routière par excellence. Gorgeous coachbuilt bodies by Figoni, Chapron, and Franay atop a sporty twin-cam chassis." },

  { name:"Delage D8",                  make:"Delage",       model:"D8",                era:"Pre-War",  flag:"🇫🇷", years:"1929–40", country:"France", produced:"~400",  surviving:"~200",  value:"£300K–£900K",  rarity:"epic",      hagerty:"delage/d8/1932/1932-delage-d8",
    desc:"Designed by Albert Lory. A straight-eight luxury car that competed directly with Bugatti and Hispano-Suiza at the very top of the market." },

  { name:"Invicta 4½ Litre S-Type",    make:"Invicta",      model:"4½ Litre S-Type",   era:"Pre-War",  flag:"🇬🇧", years:"1930–33", country:"UK",     produced:"~77",   surviving:"~50",   value:"£200K–£500K",  rarity:"epic",      hagerty:"",
    desc:"Low-slung, powerful, fast. Donald Healey won the Monte Carlo Rally in one. Among the most desirable and rare British pre-war cars." },

  { name:"Riley Nine MPH",             make:"Riley",        model:"Nine MPH",          era:"Pre-War",  flag:"🇬🇧", years:"1934–36", country:"UK",     produced:"~350",  surviving:"~150",  value:"£40K–£90K",    rarity:"rare",      hagerty:"",
    desc:"A proper twin-cam sports car at a modest price. The backbone of early British club racing. Beautiful line and excellent road manners." },

  { name:"Alvis Speed 25",             make:"Alvis",        model:"Speed 25",          era:"Pre-War",  flag:"🇬🇧", years:"1936–40", country:"UK",     produced:"~240",  surviving:"~150",  value:"£80K–£250K",   rarity:"epic",      hagerty:"",
    desc:"A 110mph straight-six grand tourer in the British tradition. Often bodied by Vanden Plas or Cross & Ellis. Immensely capable and refined." },

  { name:"Aston Martin Ulster",        make:"Aston Martin", model:"Ulster",            era:"Pre-War",  flag:"🇬🇧", years:"1934–36", country:"UK",     produced:"21",    surviving:"~18",   value:"£600K–£1.5M",  rarity:"legendary", hagerty:"",
    desc:"Named for the Ulster TT race. The definitive pre-war Aston Martin road-racer. Every survivor is a national treasure." },

  { name:"HRG 1500",                   make:"HRG",          model:"1500",              era:"Pre-War",  flag:"🇬🇧", years:"1935–56", country:"UK",     produced:"~240",  surviving:"~170",  value:"£35K–£90K",    rarity:"rare",      hagerty:"",
    desc:"Essentially a 1920s design built well into the 1950s by enthusiast request. Vintage charm with a Singer overhead-cam engine." },

// ─── 1950s additions ─────────────────────────────────────────────────────────

  { name:"Austin-Healey 3000 Mk1",     make:"Austin-Healey",model:"3000 Mk1",          era:"1950s",    flag:"🇬🇧", years:"1959–61", country:"UK",     produced:"13,650",surviving:"~6,000",value:"£35K–£80K",    rarity:"rare",      hagerty:"austin~healey/3000/1960/1960-austin~healey-3000",
    desc:"The Big Healey at its most raw. 2.9-litre six-cylinder, front disc brakes, proper rally car. Won the Alpine Rally outright." },

  { name:"Austin-Healey 3000 Mk3",     make:"Austin-Healey",model:"3000 Mk3",          era:"1950s",    flag:"🇬🇧", years:"1963–68", country:"UK",     produced:"17,712",surviving:"~8,000",value:"£35K–£85K",    rarity:"rare",      hagerty:"austin~healey/3000/1965/1965-austin~healey-3000_mk_iii",
    desc:"The definitive Big Healey. Wood-trimmed cockpit, 148bhp, wind-up windows. The most usable and attractive of the 3000 series." },

  { name:"Ferrari 500 Mondial",        make:"Ferrari",      model:"500 Mondial",       era:"1950s",    flag:"🇮🇹", years:"1953–55", country:"Italy",  produced:"29",    surviving:"~25",   value:"£3M–£7M",      rarity:"legendary", hagerty:"ferrari/500_mondial/1954/1954-ferrari-500_mondial",
    desc:"A Formula 2-derived sports racer in Pininfarina and Scaglietti coachwork. Driven by Ascari and Hawthorn. Devastatingly beautiful." },

  { name:"Maserati 300S",              make:"Maserati",     model:"300S",              era:"1950s",    flag:"🇮🇹", years:"1955–58", country:"Italy",  produced:"26",    surviving:"~24",   value:"£3M–£7M",      rarity:"legendary", hagerty:"maserati/300s/1956/1956-maserati-300s",
    desc:"Won the Venezuelan GP and placed second at Le Mans. The 3-litre straight-six racer that kept Maserati competitive against Ferrari." },

  { name:"Fiat 8V Zagato",             make:"Fiat",         model:"8V Zagato",         era:"1950s",    flag:"🇮🇹", years:"1952–54", country:"Italy",  produced:"~34",   surviving:"~25",   value:"£1M–£3M",      rarity:"legendary", hagerty:"fiat/8v/1953/1953-fiat-8v",
    desc:"Fiat's secret V8 engine clothed by Zagato in a remarkably modern body. A landmark Italian design that influenced a generation of coachbuilders." },

  { name:"Sunbeam Alpine Series 1",    make:"Sunbeam",      model:"Alpine",            era:"1950s",    flag:"🇬🇧", years:"1959–63", country:"UK",     produced:"11,904",surviving:"~3,000",value:"£12K–£35K",    rarity:"rare",      hagerty:"sunbeam/alpine/1960/1960-sunbeam-alpine",
    desc:"An elegant British roadster that appealed to the American market. Cary Grant drove one. The Tiger version with Ford V8 is spectacular." },

  { name:"Volvo P1800",                make:"Volvo",        model:"P1800",             era:"1950s",    flag:"🇸🇪", years:"1961–73", country:"Sweden", produced:"47,492",surviving:"~20,000",value:"£15K–£45K",    rarity:"rare",      hagerty:"volvo/p1800/1962/1962-volvo-p1800",
    desc:"Simon Templar's car in The Saint. Elegant coachbuilt styling, genuine GT capability. One example famously covered 3 million miles." },

  { name:"Facel Vega HK500",           make:"Facel Vega",   model:"HK500",             era:"1950s",    flag:"🇫🇷", years:"1958–61", country:"France", produced:"489",   surviving:"~300",  value:"£150K–£400K",  rarity:"epic",      hagerty:"facel_vega/hk500/1959/1959-facel_vega-hk500",
    desc:"A French grand tourer with an American Chrysler V8. Elegant and ferociously fast. Albert Camus was killed in one. Ava Gardner owned one." },

  { name:"Simca Aronde Montlhéry",     make:"Simca",        model:"Aronde Montlhéry",  era:"1950s",    flag:"🇫🇷", years:"1955–62", country:"France", produced:"~3,500",surviving:"~500",  value:"£8K–£20K",     rarity:"rare",      hagerty:"",
    desc:"The sporting version of Simca's popular Aronde saloon. Named after the Montlhéry speed oval. A charming piece of French motoring culture." },

  { name:"Triumph TR3",                make:"Triumph",      model:"TR3",               era:"1950s",    flag:"🇬🇧", years:"1955–57", country:"UK",     produced:"13,377",surviving:"~5,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"triumph/tr3/1956/1956-triumph-tr3",
    desc:"Added disc brakes to the TR formula — the first British production car to have them. Raw, effective, and classically British." },

  { name:"Healey Silverstone",         make:"Healey",       model:"Silverstone",       era:"1950s",    flag:"🇬🇧", years:"1949–50", country:"UK",     produced:"105",   surviving:"~70",   value:"£80K–£200K",   rarity:"epic",      hagerty:"",
    desc:"Donald Healey's purpose-built circuit car. Aerodynamic bodywork, the spare wheel mounted as a front bumper. Remarkably advanced for 1949." },

  { name:"AC Aceca",                   make:"AC",           model:"Aceca",             era:"1950s",    flag:"🇬🇧", years:"1954–63", country:"UK",     produced:"~170",  surviving:"~140",  value:"£80K–£200K",   rarity:"epic",      hagerty:"ac/aceca/1956/1956-ac-aceca",
    desc:"The fastback coupé version of the Ace. Identical chassis, elegant notchback roof. Bristol-engined examples are the most desirable." },

  { name:"MGB Roadster",               make:"MG",           model:"MGB",               era:"1960s",    flag:"🇬🇧", years:"1962–80", country:"UK",     produced:"387,259",surviving:"~100,000",value:"£10K–£30K",  rarity:"common",    hagerty:"mg/mgb/1965/1965-mg-mgb",
    desc:"The world's best-selling classic sports car. Simple, reliable, beautiful. Chrome-bumper cars are the most sought-after." },

// ─── 1960s additions ─────────────────────────────────────────────────────────

  { name:"MGB GT",                     make:"MG",           model:"MGB GT",            era:"1960s",    flag:"🇬🇧", years:"1965–80", country:"UK",     produced:"125,597",surviving:"~50,000",value:"£10K–£28K",  rarity:"common",    hagerty:"mg/mgb/1969/1969-mg-mgb-gt",
    desc:"Pininfarina's elegant fastback on the MGB chassis. More practical than the roadster, often overlooked, and increasingly appreciated." },

  { name:"Triumph TR4",                make:"Triumph",      model:"TR4",               era:"1960s",    flag:"🇬🇧", years:"1961–65", country:"UK",     produced:"40,253",surviving:"~12,000",value:"£18K–£45K",   rarity:"rare",      hagerty:"triumph/tr4/1963/1963-triumph-tr4",
    desc:"Giovanni Michelotti's fresh body on the TR3A chassis. Wind-up windows, wider cockpit. The most refined of the early TRs." },

  { name:"Triumph TR5",                make:"Triumph",      model:"TR5",               era:"1960s",    flag:"🇬🇧", years:"1967–68", country:"UK",     produced:"2,947", surviving:"~1,200",value:"£35K–£75K",    rarity:"rare",      hagerty:"triumph/tr5/1967/1967-triumph-tr5",
    desc:"The first TR with fuel injection. Remarkably rare UK-market car — most went to the USA as carburetted TR250s. Fast and sonorous." },

  { name:"Triumph TR6",                make:"Triumph",      model:"TR6",               era:"1960s",    flag:"🇬🇧", years:"1969–76", country:"UK",     produced:"94,619",surviving:"~35,000",value:"£20K–£55K",   rarity:"common",    hagerty:"triumph/tr6/1972/1972-triumph-tr6",
    desc:"Karmann's restyle of the TR5. The most powerful and dramatic TR of the classic era. Fuel injection on UK cars. Deeply satisfying to drive." },

  { name:"Triumph Spitfire Mk1",       make:"Triumph",      model:"Spitfire",          era:"1960s",    flag:"🇬🇧", years:"1962–64", country:"UK",     produced:"45,753",surviving:"~10,000",value:"£8K–£25K",    rarity:"common",    hagerty:"triumph/spitfire/1964/1964-triumph-spitfire",
    desc:"Michelotti's pretty small roadster. Affordable fun with a separate chassis and swing-axle rear. Named for the Supermarine Spitfire." },

  { name:"Triumph GT6",                make:"Triumph",      model:"GT6",               era:"1960s",    flag:"🇬🇧", years:"1966–73", country:"UK",     produced:"40,926",surviving:"~10,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"triumph/gt6/1969/1969-triumph-gt6",
    desc:"The six-cylinder Spitfire-based coupé. The Mk3 with the improved rear suspension is the driver's choice. Lovely six-cylinder sound." },

  { name:"Triumph Stag",               make:"Triumph",      model:"Stag",              era:"1960s",    flag:"🇬🇧", years:"1970–77", country:"UK",     produced:"25,877",surviving:"~10,000",value:"£15K–£45K",   rarity:"rare",      hagerty:"triumph/stag/1972/1972-triumph-stag",
    desc:"A beautifully styled four-seat roadster with a unique V8. Suffered from engine reliability issues but properly sorted examples are wonderful." },

  { name:"Lotus Seven S2",             make:"Lotus",        model:"Seven S2",          era:"1960s",    flag:"🇬🇧", years:"1960–68", country:"UK",     produced:"~1,300",surviving:"~800",  value:"£35K–£80K",    rarity:"rare",      hagerty:"lotus/seven/1964/1964-lotus-seven",
    desc:"Colin Chapman's iconic minimalist roadster. No roof, no windscreen, just four wheels and an engine. Immortalised in The Prisoner TV series." },

  { name:"Alfa Romeo Spider Duetto",   make:"Alfa Romeo",   model:"Spider Duetto",     era:"1960s",    flag:"🇮🇹", years:"1966–69", country:"Italy",  produced:"6,325", surviving:"~3,000",value:"£30K–£75K",    rarity:"rare",      hagerty:"alfa_romeo/spider/1967/1967-alfa_romeo-spider",
    desc:"The boat-tail Spider — the purest and most beautiful. Pininfarina's masterpiece. Dustin Hoffman drove one in The Graduate." },

  { name:"Alfa Romeo Spider S3",       make:"Alfa Romeo",   model:"Spider S3",         era:"1960s",    flag:"🇮🇹", years:"1983–89", country:"Italy",  produced:"~12,000",surviving:"~6,000",value:"£10K–£28K",   rarity:"common",    hagerty:"alfa_romeo/spider/1986/1986-alfa_romeo-spider",
    desc:"The fuel-injected Alfa Spider. Still the same gorgeous Pininfarina design after 20 years. Aerofoil spoilers divide opinion." },

  { name:"Lamborghini Espada",         make:"Lamborghini",  model:"Espada",            era:"1960s",    flag:"🇮🇹", years:"1968–78", country:"Italy",  produced:"1,217", surviving:"~800",  value:"£80K–£200K",   rarity:"rare",      hagerty:"lamborghini/espada/1972/1972-lamborghini-espada",
    desc:"Bertone's four-seat Lamborghini. A full-size GT with a 4-litre V12. Unusual, dramatic, and an increasingly serious collector piece." },

  { name:"Ferrari 246 Dino GT",        make:"Ferrari",      model:"246 Dino GT",       era:"1960s",    flag:"🇮🇹", years:"1969–74", country:"Italy",  produced:"2,826", surviving:"~2,400",value:"£200K–£500K",  rarity:"epic",      hagerty:"ferrari/246/1971/1971-ferrari-246-dino_gt",
    desc:"Named for Enzo Ferrari's son. A mid-engined V6 of perfect proportions. Not badged as a Ferrari at launch. Now deeply loved." },

  { name:"Ferrari 246 Dino GTS",       make:"Ferrari",      model:"246 Dino GTS",      era:"1960s",    flag:"🇮🇹", years:"1972–74", country:"Italy",  produced:"1,274", surviving:"~1,100",value:"£220K–£550K",  rarity:"epic",      hagerty:"ferrari/246/1972/1972-ferrari-246-dino_gts",
    desc:"The targa-top version of the Dino. Open-air Dino motoring with a removable roof panel stored in the nose. Exquisite." },

  { name:"Maserati Bora",              make:"Maserati",     model:"Bora",              era:"1960s",    flag:"🇮🇹", years:"1971–78", country:"Italy",  produced:"564",   surviving:"~400",  value:"£150K–£400K",  rarity:"epic",      hagerty:"maserati/bora/1972/1972-maserati-bora",
    desc:"Giugiaro's mid-engined answer to the Miura. A 4.7-litre V8, hydraulic pedal box, and a beautifully resolved fastback body." },

  { name:"Maserati Merak",             make:"Maserati",     model:"Merak",             era:"1960s",    flag:"🇮🇹", years:"1972–83", country:"Italy",  produced:"1,830", surviving:"~1,000",value:"£40K–£90K",    rarity:"rare",      hagerty:"maserati/merak/1974/1974-maserati-merak",
    desc:"Giugiaro's baby Bora with a V6 engine and 2+2 seating. Often overlooked but charming, fast, and one of the best-looking Maseratis." },

  { name:"Iso Grifo",                  make:"Iso",          model:"Grifo",             era:"1960s",    flag:"🇮🇹", years:"1965–74", country:"Italy",  produced:"~504",  surviving:"~300",  value:"£150K–£400K",  rarity:"epic",      hagerty:"iso/grifo/1967/1967-iso-grifo",
    desc:"Bertone body, Chevrolet V8, Bizzarrini chassis. Italy's answer to the Ferrari 275 GTB at a fraction of the price. Strikingly beautiful." },

  { name:"Pontiac GTO 1st Gen",        make:"Pontiac",      model:"GTO",               era:"1960s",    flag:"🇺🇸", years:"1964–67", country:"USA",    produced:"~240,000",surviving:"~40,000",value:"£30K–£80K",  rarity:"rare",      hagerty:"pontiac/gto/1965/1965-pontiac-gto",
    desc:"The car that invented the muscle car. 389 cubic inches in a mid-size Tempest body. John DeLorean's idea that defined an era." },

  { name:"Chevrolet Camaro Z/28 1st Gen",make:"Chevrolet",  model:"Camaro Z/28",       era:"1960s",    flag:"🇺🇸", years:"1967–69", country:"USA",    produced:"~20,000",surviving:"~8,000",value:"£50K–£120K",  rarity:"rare",      hagerty:"chevrolet/camaro/1969/1969-chevrolet-camaro-z!28",
    desc:"Built purely to homologate for the Trans-Am Series. High-revving 302 V8, front disc brakes. The driver's muscle car." },

  { name:"Dodge Charger R/T 1969",     make:"Dodge",        model:"Charger R/T",       era:"1960s",    flag:"🇺🇸", years:"1969",    country:"USA",    produced:"~70,000",surviving:"~12,000",value:"£40K–£120K",  rarity:"rare",      hagerty:"dodge/charger/1969/1969-dodge-charger-r!t",
    desc:"The fastback coupé that defined American muscle. Driven by the General Lee in The Dukes of Hazzard. A Bullitt original." },

  { name:"Plymouth Barracuda 'Cuda 440",make:"Plymouth",    model:"Barracuda 'Cuda",   era:"1960s",    flag:"🇺🇸", years:"1970–71", country:"USA",    produced:"~2,100",surviving:"~1,000",value:"£80K–£250K",  rarity:"epic",      hagerty:"plymouth/barracuda/1970/1970-plymouth-barracuda-cuda_440",
    desc:"The E-Body Barracuda with the 440 Six Pack. Among the most collectible American muscle cars. Hemi versions are legends." },

  { name:"Shelby Cobra 289",           make:"AC",           model:"Cobra 289",         era:"1960s",    flag:"🇬🇧", years:"1962–65", country:"UK",     produced:"~655",  surviving:"~500",  value:"£200K–£600K",  rarity:"epic",      hagerty:"ac/cobra/1964/1964-ac-cobra",
    desc:"The original Cobra with the 289 Ford V8. More nimble than the later 427. Carroll Shelby's original and arguably purest vision." },

// ─── 70s–80s additions ───────────────────────────────────────────────────────

  { name:"Ferrari 308 GT4",            make:"Ferrari",      model:"308 GT4",           era:"70s–80s",  flag:"🇮🇹", years:"1973–80", country:"Italy",  produced:"2,826", surviving:"~2,200",value:"£35K–£75K",    rarity:"rare",      hagerty:"ferrari/308_gt4/1977/1977-ferrari-308_gt4",
    desc:"Ferrari's only Bertone-bodied road car. The 2+2 mid-engined GT. Initially underappreciated, now recognised as an elegant Bertone design." },

  { name:"Ferrari Testarossa",         make:"Ferrari",      model:"Testarossa",        era:"70s–80s",  flag:"🇮🇹", years:"1984–91", country:"Italy",  produced:"7,177", surviving:"~6,000",value:"£120K–£280K",  rarity:"epic",      hagerty:"ferrari/testarossa/1987/1987-ferrari-testarossa",
    desc:"The iconic wide-hipped Pininfarina supercar. Flat-12 engine, side strakes, pop-up headlights. Miami Vice made it a cultural phenomenon." },

  { name:"Ferrari 348 tb",             make:"Ferrari",      model:"348 tb",            era:"70s–80s",  flag:"🇮🇹", years:"1989–93", country:"Italy",  produced:"2,895", surviving:"~2,500",value:"£50K–£100K",   rarity:"rare",      hagerty:"ferrari/348/1991/1991-ferrari-348_tb",
    desc:"The controversial 308 replacement. Longitudinal V8, stiffened chassis. Initially criticised but now properly appreciated as a driver's car." },

  { name:"Lamborghini Diablo",         make:"Lamborghini",  model:"Diablo",            era:"70s–80s",  flag:"🇮🇹", years:"1990–2001",country:"Italy",  produced:"2,884", surviving:"~2,200",value:"£150K–£400K",  rarity:"epic",      hagerty:"lamborghini/diablo/1993/1993-lamborghini-diablo",
    desc:"The 202mph monster that replaced the Countach. Marcello Gandini's design. The VT version added AWD and traction control." },

  { name:"Porsche 928 S4",             make:"Porsche",      model:"928 S4",            era:"70s–80s",  flag:"🇩🇪", years:"1987–91", country:"Germany",produced:"~17,000",surviving:"~7,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"porsche/928/1988/1988-porsche-928-s4",
    desc:"The front-engined V8 GT that Porsche designed as the 911's replacement. Sophisticated, fast, and deeply undervalued." },

  { name:"Porsche 968",                make:"Porsche",      model:"968",               era:"70s–80s",  flag:"🇩🇪", years:"1992–95", country:"Germany",produced:"12,776",surviving:"~7,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"porsche/968/1993/1993-porsche-968",
    desc:"The final evolution of the front-engined 924/944 line. VarioCam engine, Tiptronic or manual. The Club Sport is particularly valued." },

  { name:"BMW 635 CSi",                make:"BMW",          model:"635 CSi",           era:"70s–80s",  flag:"🇩🇪", years:"1978–89", country:"Germany",produced:"86,216",surviving:"~25,000",value:"£20K–£55K",   rarity:"rare",      hagerty:"bmw/6_series/1984/1984-bmw-635csi",
    desc:"Paul Bracq's classic E24 coupé. Straight-six, rear-wheel drive, Grand Prix starting grid. A proper grand tourer at a sensible price." },

  { name:"BMW M635 CSi",               make:"BMW",          model:"M635 CSi",          era:"70s–80s",  flag:"🇩🇪", years:"1984–89", country:"Germany",produced:"5,855", surviving:"~2,500",value:"£50K–£120K",   rarity:"rare",      hagerty:"bmw/m635_csi/1986/1986-bmw-m635_csi",
    desc:"The M1's engine in the E24 body. 286bhp straight-six, limited-slip differential, M Sport seats. The definitive version of a great coupé." },

  { name:"Mercedes-Benz 300SL R107",   make:"Mercedes-Benz",model:"300SL R107",        era:"70s–80s",  flag:"🇩🇪", years:"1971–89", country:"Germany",produced:"237,287",surviving:"~80,000",value:"£25K–£70K",   rarity:"common",    hagerty:"mercedes~benz/sl/1980/1980-mercedes~benz-380sl",
    desc:"The R107 SL ran for 18 years without significant change. A beautifully built open GT that ages superbly. 560SL version is the most powerful." },

  { name:"Mercedes-Benz 450SL R107",   make:"Mercedes-Benz",model:"450SL",             era:"70s–80s",  flag:"🇩🇪", years:"1971–80", country:"Germany",produced:"66,298",surviving:"~30,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"mercedes~benz/450sl/1975/1975-mercedes~benz-450sl",
    desc:"The V8-powered SL that dominated European roads in the 1970s. A Hollywood favourite. Bulletproof engineering and lasting elegance." },

  { name:"Mercedes-Benz 500E",         make:"Mercedes-Benz",model:"500E",              era:"70s–80s",  flag:"🇩🇪", years:"1991–94", country:"Germany",produced:"10,479",surviving:"~6,000",value:"£25K–£65K",    rarity:"rare",      hagerty:"mercedes~benz/500e/1992/1992-mercedes~benz-500e",
    desc:"Hand-assembled at Porsche's Zuffenhausen factory. A 5-litre V8 inserted into the W124 E-Class. The discreet German super-saloon." },

  { name:"Mercedes-Benz 190E 2.3-16",  make:"Mercedes-Benz",model:"190E 2.3-16",       era:"70s–80s",  flag:"🇩🇪", years:"1984–88", country:"Germany",produced:"19,724",surviving:"~8,000",value:"£20K–£50K",    rarity:"rare",      hagerty:"mercedes~benz/190e/1985/1985-mercedes~benz-190e-2.3_16",
    desc:"Cosworth-developed 16-valve head on the 190 body. Ayrton Senna won the launch race at the Nürburgring. A proper compact sports saloon." },

  { name:"Jaguar XJ-S V12",            make:"Jaguar",       model:"XJ-S",              era:"70s–80s",  flag:"🇬🇧", years:"1975–96", country:"UK",     produced:"115,413",surviving:"~30,000",value:"£15K–£45K",   rarity:"common",    hagerty:"jaguar/xj~s/1980/1980-jaguar-xj~s",
    desc:"Malcolm Sayer's unconventional grand tourer. 5.3-litre V12, flying buttress C-pillars. Maligned for years, now properly appreciated." },

  { name:"Jaguar XJR V8",              make:"Jaguar",       model:"XJR",               era:"70s–80s",  flag:"🇬🇧", years:"1994–2003",country:"UK",    produced:"~18,000",surviving:"~8,000",value:"£10K–£30K",    rarity:"common",    hagerty:"jaguar/xjr/1998/1998-jaguar-xjr",
    desc:"The supercharged AJ-V8 XJ. 370bhp in an elegant aluminium body. The fastest saloon of its era and still devastatingly quick." },

  { name:"Vauxhall Lotus Carlton",     make:"Vauxhall",     model:"Lotus Carlton",     era:"70s–80s",  flag:"🇬🇧", years:"1990–92", country:"UK",     produced:"950",   surviving:"~700",  value:"£50K–£120K",   rarity:"rare",      hagerty:"lotus/carlton/1991/1991-lotus-carlton",
    desc:"The same car as the Lotus Carlton — European-market version badged as Vauxhall. 177mph, caused a parliamentary scandal in 1990." },

  { name:"Honda CRX Si",               make:"Honda",        model:"CRX Si",            era:"70s–80s",  flag:"🇯🇵", years:"1984–91", country:"Japan",  produced:"~380,000",surviving:"~50,000",value:"£8K–£25K",    rarity:"rare",      hagerty:"honda/crx/1988/1988-honda-crx-si",
    desc:"Lightweight, efficient, brilliant handling. The double-wishbone chassis was a revelation. A future classic that's already rising fast." },

  { name:"Peugeot 205 GTI 1.9",        make:"Peugeot",      model:"205 GTI 1.9",       era:"70s–80s",  flag:"🇫🇷", years:"1987–94", country:"France", produced:"~80,000",surviving:"~8,000",value:"£15K–£45K",    rarity:"rare",      hagerty:"peugeot/205/1988/1988-peugeot-205-gti",
    desc:"The 1.9-litre GTI elevated the hot hatch to an art form. 130bhp, remarkable balance, tactile steering. Shockingly rare survivors." },

  { name:"Peugeot 205 T16",            make:"Peugeot",      model:"205 T16",           era:"70s–80s",  flag:"🇫🇷", years:"1984–85", country:"France", produced:"200",   surviving:"~160",  value:"£300K–£700K",  rarity:"epic",      hagerty:"peugeot/205/1985/1985-peugeot-205-t16",
    desc:"The Group B homologation special. Mid-engined, turbocharged, AWD. Won the World Rally Championship in 1985 and 1986. Road version is incredible." },

  { name:"Ford RS200",                 make:"Ford",         model:"RS200",             era:"70s–80s",  flag:"🇬🇧", years:"1984–86", country:"UK",     produced:"200",   surviving:"~180",  value:"£350K–£800K",  rarity:"epic",      hagerty:"ford/rs200/1986/1986-ford-rs200",
    desc:"Ford's Group B weapon. Mid-engined, turbocharged, AWD. An outstanding road car in its own right. Designed at Ghia by Filippo Sapino." },

  { name:"Audi Sport Quattro",         make:"Audi",         model:"Sport Quattro",     era:"70s–80s",  flag:"🇩🇪", years:"1984–85", country:"Germany",produced:"224",   surviving:"~200",  value:"£300K–£700K",  rarity:"epic",      hagerty:"audi/sport_quattro/1984/1984-audi-sport_quattro",
    desc:"The short-wheelbase homologation quattro. 306bhp, AWD, a compressed masterpiece. Dominated the WRC alongside the Peugeot 205 T16." },

  { name:"Audi Quattro",               make:"Audi",         model:"Quattro",           era:"70s–80s",  flag:"🇩🇪", years:"1980–91", country:"Germany",produced:"11,452",surviving:"~5,000",value:"£40K–£100K",   rarity:"rare",      hagerty:"audi/quattro/1983/1983-audi-quattro",
    desc:"The car that changed rallying forever. Four-wheel drive and a turbocharged five-cylinder. Introduced in 1980 at Geneva to universal disbelief." },

  { name:"Alfa Romeo Spider S2",       make:"Alfa Romeo",   model:"Spider S2",         era:"70s–80s",  flag:"🇮🇹", years:"1970–83", country:"Italy",  produced:"~23,000",surviving:"~8,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"alfa_romeo/spider/1978/1978-alfa_romeo-spider",
    desc:"The Kamm-tail Spider, with a more practical boot. The 2000 Veloce with fuel injection and alloys is the most desirable." },

  { name:"Alfa Romeo GTV6",            make:"Alfa Romeo",   model:"GTV6",              era:"70s–80s",  flag:"🇮🇹", years:"1980–87", country:"Italy",  produced:"~13,000",surviving:"~4,000",value:"£15K–£40K",   rarity:"rare",      hagerty:"alfa_romeo/gtv6/1984/1984-alfa_romeo-gtv6",
    desc:"The Busso V6 transplanted into the Alfetta GT body. An exquisite engine in a handsome body. Won the ERC rally championship." },

  { name:"Triumph Dolomite Sprint",    make:"Triumph",      model:"Dolomite Sprint",   era:"70s–80s",  flag:"🇬🇧", years:"1973–80", country:"UK",     produced:"22,941",surviving:"~2,000",value:"£8K–£25K",    rarity:"rare",      hagerty:"triumph/dolomite/1975/1975-triumph-dolomite-sprint",
    desc:"The world's first production 16-valve engine, in a four-door saloon. Won the BTCC in 1975. Underrated but increasingly collectable." },

  { name:"Lancia Beta Montecarlo",     make:"Lancia",       model:"Beta Montecarlo",   era:"70s–80s",  flag:"🇮🇹", years:"1975–81", country:"Italy",  produced:"7,595", surviving:"~2,000",value:"£15K–£40K",    rarity:"rare",      hagerty:"lancia/beta_montecarlo/1977/1977-lancia-beta_montecarlo",
    desc:"A mid-engined Fiat twin-cam in a Pininfarina body. Remarkable value and a delightful drive. Spyder version is particularly attractive." },

  { name:"Lancia Delta HF Integrale 16v",make:"Lancia",     model:"Delta HF Integrale",era:"70s–80s",  flag:"🇮🇹", years:"1989–92", country:"Italy",  produced:"~26,000",surviving:"~10,000",value:"£40K–£100K",  rarity:"rare",      hagerty:"lancia/delta_hf_integrale/1990/1990-lancia-delta_hf_integrale",
    desc:"Six consecutive World Rally Championship victories 1987–92. A humble three-door hatchback that became a legend. Incredibly fast on any road." },

  { name:"Caterham Seven",             make:"Caterham",     model:"Seven",             era:"70s–80s",  flag:"🇬🇧", years:"1973–",   country:"UK",     produced:"~12,000",surviving:"~10,000",value:"£15K–£45K",   rarity:"rare",      hagerty:"",
    desc:"The continuation of the Lotus Seven after Chapman sold the design. Perpetually unchanged, perpetually brilliant. Raw driving at its purest." },

// ─── 1990s additions ─────────────────────────────────────────────────────────

  { name:"Ferrari 456M GT",            make:"Ferrari",      model:"456M GT",           era:"1990s",    flag:"🇮🇹", years:"1998–2003",country:"Italy",  produced:"~1,200",surviving:"~1,000",value:"£70K–£150K",   rarity:"rare",      hagerty:"ferrari/456_m/2000/2000-ferrari-456_m-gt",
    desc:"The refined version of the 456 GT. 5.5-litre V12, optional automatic gearbox. The last true front-engined Ferrari 2+2 of its era." },

  { name:"Ferrari F355 Challenge",     make:"Ferrari",      model:"F355 Challenge",    era:"1990s",    flag:"🇮🇹", years:"1995–99", country:"Italy",  produced:"~50",   surviving:"~45",   value:"£150K–£300K",  rarity:"epic",      hagerty:"",
    desc:"The circuit-ready 355. Roll cage, fire suppression, no weight-saving spared. Now eligible for historic competition." },

  { name:"Porsche 993 Carrera 4S",     make:"Porsche",      model:"993 C4S",           era:"1990s",    flag:"🇩🇪", years:"1995–98", country:"Germany",produced:"~6,100",surviving:"~4,500",value:"£80K–£180K",   rarity:"rare",      hagerty:"porsche/993/1997/1997-porsche-993-carrera_4s",
    desc:"The wide-body 993 with Turbo arches and all-wheel drive. The best of all worlds — flared, beautiful, composed. Hugely sought after." },

  { name:"Porsche Boxster S 986",      make:"Porsche",      model:"Boxster S 986",     era:"1990s",    flag:"🇩🇪", years:"1999–2004",country:"Germany",produced:"~28,000",surviving:"~15,000",value:"£12K–£30K",  rarity:"common",    hagerty:"porsche/boxster/1999/1999-porsche-boxster_s",
    desc:"The mid-engined 3.2-litre flat-six open-top Porsche. Sublime handling, driver-focused, and sensationally undervalued." },

  { name:"Aston Martin Vantage V600",  make:"Aston Martin", model:"Vantage V600",      era:"1990s",    flag:"🇬🇧", years:"1998–99", country:"UK",     produced:"~240",  surviving:"~200",  value:"£200K–£500K",  rarity:"epic",      hagerty:"aston_martin/vantage/1998/1998-aston_martin-vantage",
    desc:"600bhp twin-supercharged V8. The most powerful production car built in Britain at the time. Limited-edition final run of the classic V8." },

  { name:"Jaguar XK8",                 make:"Jaguar",       model:"XK8",               era:"1990s",    flag:"🇬🇧", years:"1996–2006",country:"UK",    produced:"~91,000",surviving:"~40,000",value:"£8K–£25K",    rarity:"common",    hagerty:"jaguar/xk8/1998/1998-jaguar-xk8",
    desc:"Ian Callum's elegant XK replacement. The AJ-V8 engine, beautiful Pininfarina-influenced body. XKR with supercharger is the driver's choice." },

  { name:"Lamborghini Murcielago",     make:"Lamborghini",  model:"Murcielago",        era:"1990s",    flag:"🇮🇹", years:"2001–10", country:"Italy",  produced:"4,099", surviving:"~3,500",value:"£120K–£280K",  rarity:"epic",      hagerty:"lamborghini/murcielago/2002/2002-lamborghini-murcielago",
    desc:"The Diablo's successor. 6.5-litre V12 in the Roadster version. Scissor doors, AWD, and a presence that silences traffic." },

  { name:"BMW Z3 M Roadster",          make:"BMW",          model:"Z3 M Roadster",     era:"1990s",    flag:"🇩🇪", years:"1997–2002",country:"Germany",produced:"~15,000",surviving:"~8,000",value:"£20K–£50K",   rarity:"rare",      hagerty:"bmw/z3/1998/1998-bmw-z3-m_roadster",
    desc:"The S50/S54 straight-six in a compact roadster. Rear-wheel drive, beautiful proportions, howling engine. Now a cult classic." },

  { name:"BMW E39 M5",                 make:"BMW",          model:"M5 E39",            era:"1990s",    flag:"🇩🇪", years:"1998–2003",country:"Germany",produced:"20,482",surviving:"~10,000",value:"£25K–£65K",   rarity:"rare",      hagerty:"bmw/m5/2000/2000-bmw-m5",
    desc:"Widely considered the greatest M5 ever made. The S62 V8 with 400bhp in a subtly bodied saloon. Precise, fast, devastatingly complete." },

  { name:"Renault Sport Spider",       make:"Renault",      model:"Sport Spider",      era:"1990s",    flag:"🇫🇷", years:"1996–99", country:"France", produced:"1,730", surviving:"~1,200",value:"£15K–£40K",    rarity:"rare",      hagerty:"renault/sport_spider/1997/1997-renault-sport_spider",
    desc:"An aluminium-framed, mid-engined open roadster with no windscreen as standard. A bold French interpretation of a pure sports car." },

  { name:"Lancia Delta Integrale Evo 2",make:"Lancia",      model:"Delta Integrale Evo 2",era:"1990s",  flag:"🇮🇹", years:"1993–95", country:"Italy",  produced:"~10,000",surviving:"~5,000",value:"£50K–£130K",  rarity:"rare",      hagerty:"lancia/delta_hf_integrale/1993/1993-lancia-delta_hf_integrale-evo_2",
    desc:"The definitive Delta. Revised suspension, bigger brakes, 215bhp. The Collezione final editions are the most valuable." },

  { name:"Alfa Romeo 147 GTA",         make:"Alfa Romeo",   model:"147 GTA",           era:"1990s",    flag:"🇮🇹", years:"2002–05", country:"Italy",  produced:"~2,500",surviving:"~1,000",value:"£18K–£45K",    rarity:"rare",      hagerty:"alfa_romeo/147/2002/2002-alfa_romeo-147-gta",
    desc:"3.2-litre Busso V6 in a hatchback body. The Q2 torque-sensing differential and Brembo brakes make this a deeply rewarding driver's car." },

  { name:"Honda Integra Type R DC2",   make:"Honda",        model:"Integra Type R",    era:"1990s",    flag:"🇯🇵", years:"1995–2000",country:"Japan",  produced:"~14,000",surviving:"~6,000",value:"£20K–£60K",   rarity:"rare",      hagerty:"honda/integra/1997/1997-honda-integra-type_r",
    desc:"The B18C engine revving to 8,400rpm, limited-slip differential, and recaro seats. Considered the finest front-wheel drive car ever made." },

  { name:"Honda Civic Type R EK9",     make:"Honda",        model:"Civic Type R EK9",  era:"1990s",    flag:"🇯🇵", years:"1997–2000",country:"Japan",  produced:"~8,000",surviving:"~3,000",value:"£20K–£60K",   rarity:"rare",      hagerty:"honda/civic/1997/1997-honda-civic-type_r",
    desc:"The B16B engine in the three-door Civic. 185bhp naturally-aspirated from 1.6 litres. The beginning of the Type R legend." },

  { name:"Toyota MR2 Mk2 Turbo",       make:"Toyota",       model:"MR2 Turbo",         era:"1990s",    flag:"🇯🇵", years:"1989–99", country:"Japan",  produced:"~140,000",surviving:"~30,000",value:"£12K–£35K",  rarity:"rare",      hagerty:"toyota/mr2/1991/1991-toyota-mr2",
    desc:"Mid-engined, 245bhp turbocharged, affordable. Often compared to Ferrari's mid-engined cars in layout and feel. Stunning value." },

  { name:"Mazda MX-5 Mk1 NA",         make:"Mazda",        model:"MX-5 NA",           era:"1990s",    flag:"🇯🇵", years:"1989–98", country:"Japan",  produced:"~431,000",surviving:"~150,000",value:"£8K–£22K",  rarity:"common",    hagerty:"mazda/mx~5_miata/1990/1990-mazda-mx~5_miata",
    desc:"The car that saved the roadster. Repackaged the Elan's philosophy for the 1990s. Perfectly balanced, utterly joyful." },

  { name:"Porsche 911 GT3 996",        make:"Porsche",      model:"996 GT3",           era:"1990s",    flag:"🇩🇪", years:"2003–05", country:"Germany",produced:"~1,200",surviving:"~1,000",value:"£80K–£150K",   rarity:"rare",      hagerty:"porsche/996/2004/2004-porsche-996-gt3",
    desc:"The RS-specification GT3 Mk2. Metzger engine upgraded to 3.6 litres. The last chance to buy a naturally-aspirated Porsche GT car at a sensible price." },

  { name:"BMW M3 CSL E46",             make:"BMW",          model:"M3 CSL",            era:"1990s",    flag:"🇩🇪", years:"2003–04", country:"Germany",produced:"1,383", surviving:"~1,200",value:"£80K–£180K",   rarity:"rare",      hagerty:"bmw/m3/2003/2003-bmw-m3-csl",
    desc:"Coupe, Sport, Lightweight. Carbon roof, stripped interior, SMG gearbox. The E46 distilled to its essence. An instant legend." },

  { name:"Subaru Impreza P1",          make:"Subaru",       model:"Impreza P1",        era:"1990s",    flag:"🇯🇵", years:"1999–2000",country:"Japan",  produced:"1,000", surviving:"~600",  value:"£25K–£65K",    rarity:"rare",      hagerty:"subaru/impreza/2000/2000-subaru-impreza-wrx",
    desc:"Prodrive's 280bhp tuned Impreza for the UK market. The fastest UK-market Impreza of the era. Only 1,000 built." },

  { name:"Mitsubishi Lancer Evo 3",    make:"Mitsubishi",   model:"Evo III",           era:"1990s",    flag:"🇯🇵", years:"1995–96", country:"Japan",  produced:"~5,000",surviving:"~2,500",value:"£20K–£50K",    rarity:"rare",      hagerty:"mitsubishi/lancer_evolution/1995/1995-mitsubishi-lancer_evolution_iii",
    desc:"The Evo that first became truly serious. 270bhp, active yaw control, massive rear wing. The beginning of the Evo legend in earnest." },

  { name:"Ford GT90",                  make:"Ford",         model:"GT90",              era:"1990s",    flag:"🇺🇸", years:"1995",    country:"USA",    produced:"1",     surviving:"1",     value:"N/A (prototype)",rarity:"legendary", hagerty:"",
    desc:"Ford's 720bhp quad-turbocharged concept car. A one-off but appears at concours globally. A milestone in 1990s supercar design." },

  { name:"Pagani Zonda C12",           make:"Pagani",       model:"Zonda C12",         era:"1990s",    flag:"🇮🇹", years:"1999–2002",country:"Italy",  produced:"10",    surviving:"~9",    value:"£2M–£5M",      rarity:"legendary", hagerty:"pagani/zonda/1999/1999-pagani-zonda_c12",
    desc:"Horacio Pagani's extraordinary debut. A hand-formed carbon fibre body over a Mercedes AMG V12. The beginning of a legend." },

  { name:"Dodge Viper RT/10",          make:"Dodge",        model:"Viper RT/10",       era:"1990s",    flag:"🇺🇸", years:"1992–95", country:"USA",    produced:"~5,000",surviving:"~4,000",value:"£30K–£70K",    rarity:"rare",      hagerty:"dodge/viper/1994/1994-dodge-viper-rt!10",
    desc:"The original side-pipe roadster with no exterior door handles and a canvas top. Pure, uncompromising, terrifyingly fast." },

  { name:"Jaguar XKR",                 make:"Jaguar",       model:"XKR",               era:"1990s",    flag:"🇬🇧", years:"1998–2006",country:"UK",    produced:"~22,000",surviving:"~12,000",value:"£10K–£30K",   rarity:"common",    hagerty:"jaguar/xkr/1999/1999-jaguar-xkr",
    desc:"The supercharged AJ-V8 XK. 370bhp, Brembo brakes, Sport suspension. The R Pack model with upgraded Recaro seats is the finest version." },

  { name:"Westfield SEight",           make:"Westfield",    model:"SEight",            era:"1990s",    flag:"🇬🇧", years:"1994–",   country:"UK",     produced:"~500",  surviving:"~400",  value:"£15K–£35K",    rarity:"rare",      hagerty:"",
    desc:"A Rover V8 in a Westfield Seven body. Minimal car, maximum performance. The British lightweight tradition at its most extreme." },


// ─── Top-up to reach 300 ──────────────────────────────────────────────────────

  // Pre-War
  { name:"Bentley R-Type Continental",  make:"Bentley",      model:"R-Type Continental", era:"Pre-War",  flag:"🇬🇧", years:"1952–55", country:"UK",     produced:"208",   surviving:"~190",  value:"£400K–£1M",    rarity:"legendary", hagerty:"bentley/r~type_continental/1953/1953-bentley-r~type_continental",
    desc:"H.J. Mulliner's fastback body on the R-Type chassis. The fastest four-seater in the world on launch. Considered the most beautiful post-war Bentley." },

  { name:"Bugatti Type 55",             make:"Bugatti",      model:"Type 55",            era:"Pre-War",  flag:"🇫🇷", years:"1932–35", country:"France", produced:"38",    surviving:"~28",   value:"£3M–£8M",      rarity:"legendary", hagerty:"bugatti/type_55/1933/1933-bugatti-type_55",
    desc:"The Type 51 racing car engine in the Type 54 chassis with Jean Bugatti's superb roadster body. Arguably the most beautiful Bugatti ever made." },

  { name:"Amilcar CGS",                 make:"Amilcar",      model:"CGS",                era:"Pre-War",  flag:"🇫🇷", years:"1924–29", country:"France", produced:"~4,800",surviving:"~500",  value:"£25K–£65K",    rarity:"rare",      hagerty:"",
    desc:"The French sporting voiturette that won a devoted following. Lightweight, lively, and the basis for early French motorsport culture." },

  // 1950s
  { name:"Cisitalia 202",               make:"Cisitalia",    model:"202",                era:"1950s",    flag:"🇮🇹", years:"1947–52", country:"Italy",  produced:"~170",  surviving:"~100",  value:"£300K–£800K",  rarity:"epic",      hagerty:"",
    desc:"Pininfarina's masterpiece — so important it's in the MoMA in New York. The car that defined post-war Italian design language." },

  { name:"Triumph Roadster",            make:"Triumph",      model:"Roadster",           era:"1950s",    flag:"🇬🇧", years:"1946–49", country:"UK",     produced:"4,501", surviving:"~1,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"",
    desc:"The last traditional three-abreast bench-seated British roadster. The dickey seat in the boot is period charm at its most delightful." },

  { name:"Fiat 500 Nuova",              make:"Fiat",         model:"500",                era:"1950s",    flag:"🇮🇹", years:"1957–75", country:"Italy",  produced:"3.9M",  surviving:"~200K", value:"£8K–£25K",     rarity:"common",    hagerty:"fiat/500/1966/1966-fiat-500",
    desc:"Dante Giacosa's city car masterpiece. Air-cooled rear engine, suicide doors, pure Italian charm. The spiritual successor to the Austin Seven." },

  { name:"Alfa Romeo 1900 Sprint",      make:"Alfa Romeo",   model:"1900 Sprint",        era:"1950s",    flag:"🇮🇹", years:"1951–58", country:"Italy",  produced:"~1,800",surviving:"~800",  value:"£60K–£160K",   rarity:"rare",      hagerty:"alfa_romeo/1900/1953/1953-alfa_romeo-1900-sprint",
    desc:"Alfa Romeo's first unitary-construction car. Carrozzerie Touring and Pinin Farina bodied many. The car that saved Alfa Romeo after the war." },

  // 1960s
  { name:"Honda S800",                  make:"Honda",        model:"S800",               era:"1960s",    flag:"🇯🇵", years:"1966–70", country:"Japan",  produced:"11,536",surviving:"~3,000",value:"£20K–£50K",    rarity:"rare",      hagerty:"honda/s800/1967/1967-honda-s800",
    desc:"Honda's first sports car exported globally. Chain-driven rear wheels, 70bhp from 791cc. A remarkable piece of 1960s Japanese engineering." },

  { name:"Datsun 240Z",                 make:"Datsun",       model:"240Z",               era:"1960s",    flag:"🇯🇵", years:"1969–73", country:"Japan",  produced:"~156,000",surviving:"~25,000",value:"£25K–£70K",  rarity:"rare",      hagerty:"datsun/240z/1971/1971-datsun-240z",
    desc:"The first truly successful Japanese sports car in Western markets. A 2.4-litre straight-six, long bonnet, excellent handling. A genuine landmark." },

  { name:"Alfa Romeo Montreal",         make:"Alfa Romeo",   model:"Montreal",           era:"1960s",    flag:"🇮🇹", years:"1970–77", country:"Italy",  produced:"3,925", surviving:"~2,500",value:"£60K–£150K",   rarity:"rare",      hagerty:"alfa_romeo/montreal/1973/1973-alfa_romeo-montreal",
    desc:"Bertone's show car for Expo 67 that Alfa dared to put into production. V8 from the Tipo 33 race car. Exotic and impractical and irresistible." },

  { name:"Renault Alpine A110",         make:"Alpine",       model:"A110",               era:"1960s",    flag:"🇫🇷", years:"1961–77", country:"France", produced:"~7,200",surviving:"~3,000",value:"£60K–£160K",   rarity:"rare",      hagerty:"alpine/a110/1971/1971-alpine-a110",
    desc:"Won the very first World Rally Championship in 1973. Rear-engined, fibreglass body, featherweight. The soul of French rallying." },

  { name:"Iso Rivolta GT",              make:"Iso",          model:"Rivolta GT",         era:"1960s",    flag:"🇮🇹", years:"1962–70", country:"Italy",  produced:"~797",  surviving:"~400",  value:"£80K–£220K",   rarity:"epic",      hagerty:"iso/rivolta/1965/1965-iso-rivolta",
    desc:"Bertone designed, Chevrolet V8 powered, Italian crafted. A more practical alternative to the Ferrari 250 GT at a fraction of the cost." },

  // 70s–80s
  { name:"Porsche 911 SC",              make:"Porsche",      model:"911 SC",             era:"70s–80s",  flag:"🇩🇪", years:"1978–83", country:"Germany",produced:"~58,000",surviving:"~30,000",value:"£30K–£70K",   rarity:"rare",      hagerty:"porsche/911/1980/1980-porsche-911-sc",
    desc:"The SC restored Porsche's reputation for reliability. 3.0-litre, dependable, great to drive. Cabriolet version is particularly desirable." },

  { name:"Ford Capri 2.8i",             make:"Ford",         model:"Capri 2.8i",         era:"70s–80s",  flag:"🇬🇧", years:"1981–84", country:"UK",     produced:"~50,000",surviving:"~5,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"ford/capri/1982/1982-ford-capri-2.8i",
    desc:"The Cologne V6 injected Capri. Alloy wheels, body-colour spoilers, limited slip differential. The last and arguably finest Capri." },

  { name:"Volkswagen Scirocco Mk1",     make:"Volkswagen",   model:"Scirocco Mk1",       era:"70s–80s",  flag:"🇩🇪", years:"1974–81", country:"Germany",produced:"504,153",surviving:"~10,000",value:"£8K–£25K",    rarity:"rare",      hagerty:"volkswagen/scirocco/1978/1978-volkswagen-scirocco",
    desc:"Giugiaro's razor-edge Scirocco. Built at Karmann alongside the Golf. The Storm and GLi versions are the most desirable." },

  { name:"Talbot Sunbeam Lotus",        make:"Talbot",       model:"Sunbeam Lotus",      era:"70s–80s",  flag:"🇬🇧", years:"1979–81", country:"UK",     produced:"2,308", surviving:"~1,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"",
    desc:"Won the World Rally Championship in 1981 with Henri Toivonen and Guy Fréquelin. Lotus twin-cam in a Sunbeam Chrysler body. A surprise world-beater." },

  { name:"Jaguar XJ6 Series 2",         make:"Jaguar",       model:"XJ6 Series 2",       era:"70s–80s",  flag:"🇬🇧", years:"1973–79", country:"UK",     produced:"~91,000",surviving:"~15,000",value:"£8K–£25K",    rarity:"common",    hagerty:"jaguar/xj6/1975/1975-jaguar-xj6",
    desc:"Sir William Lyons' final design. Sublime ride, genuine performance, a beautifully resolved classic saloon. Still undervalued." },

  { name:"Opel GT",                     make:"Opel",         model:"GT",                 era:"70s–80s",  flag:"🇩🇪", years:"1968–73", country:"Germany",produced:"103,373",surviving:"~15,000",value:"£10K–£30K",   rarity:"rare",      hagerty:"opel/gt/1970/1970-opel-gt",
    desc:"Built in France by Brissoneau et Lotz. Retractable headlights, pop-out rear window, Corvette styling inspiration. Charming and underrated." },

  // 1990s
  { name:"Porsche Carrera GT",          make:"Porsche",      model:"Carrera GT",         era:"1990s",    flag:"🇩🇪", years:"2003–06", country:"Germany",produced:"1,270", surviving:"~1,100",value:"£600K–£1.5M",  rarity:"legendary", hagerty:"porsche/carrera_gt/2004/2004-porsche-carrera_gt",
    desc:"A V10 derived from Le Mans racing, carbon fibre monocoque, wooden gear knob. One of the greatest driver's cars ever built." },

  { name:"Aston Martin DB7 Vantage",    make:"Aston Martin", model:"DB7 Vantage",        era:"1990s",    flag:"🇬🇧", years:"1999–2003",country:"UK",    produced:"~2,100",surviving:"~1,700",value:"£35K–£80K",    rarity:"rare",      hagerty:"aston_martin/db7/2000/2000-aston_martin-db7_vantage",
    desc:"The 6.0-litre Vantage V12 transformed the DB7. 420bhp, 185mph, and the first mass-production V12 Aston for decades." },

  { name:"Ferrari 360 Modena",          make:"Ferrari",      model:"360 Modena",         era:"1990s",    flag:"🇮🇹", years:"1999–2004",country:"Italy",  produced:"8,800", surviving:"~7,500",value:"£60K–£120K",   rarity:"rare",      hagerty:"ferrari/360_modena/2001/2001-ferrari-360_modena",
    desc:"The aluminium space-frame 360 with a 400bhp V8. Pininfarina's transparent engine cover rear end. The start of Ferrari's modern era." },

  { name:"Lamborghini Gallardo",        make:"Lamborghini",  model:"Gallardo",           era:"1990s",    flag:"🇮🇹", years:"2003–13", country:"Italy",  produced:"14,022",surviving:"~11,000",value:"£60K–£140K",   rarity:"rare",      hagerty:"lamborghini/gallardo/2004/2004-lamborghini-gallardo",
    desc:"Lamborghini's most successful car ever. A 5.0-litre V10, AWD, and a Giugiaro body. The LP570 Superleggera is the lightweight special." },

  { name:"Maserati 3200 GT",            make:"Maserati",     model:"3200 GT",            era:"1990s",    flag:"🇮🇹", years:"1998–2001",country:"Italy",  produced:"4,795", surviving:"~3,000",value:"£15K–£40K",    rarity:"rare",      hagerty:"maserati/3200gt/1998/1998-maserati-3200gt",
    desc:"Giugiaro's boomerang-tailed grand tourer. Twin-turbo V8, Ferrari-sourced gearbox. The return of Maserati as a credible road car manufacturer." },

  { name:"BMW Z8",                      make:"BMW",          model:"Z8",                 era:"1990s",    flag:"🇩🇪", years:"2000–03", country:"Germany",produced:"5,703", surviving:"~5,000",value:"£90K–£200K",   rarity:"rare",      hagerty:"bmw/z8/2001/2001-bmw-z8",
    desc:"A homage to the 507 with modern M5 underpinnings. Designed by Henrik Fisker. James Bond drove one in The World Is Not Enough." },

  { name:"Volkswagen Golf R32 Mk4",     make:"Volkswagen",   model:"Golf R32 Mk4",       era:"1990s",    flag:"🇩🇪", years:"2002–04", country:"Germany",produced:"~20,000",surviving:"~8,000",value:"£12K–£35K",    rarity:"rare",      hagerty:"volkswagen/golf/2003/2003-volkswagen-golf-r32",
    desc:"The 3.2-litre VR6 with Haldex AWD in a Golf 4 body. 241bhp, a unique engine note, and understated performance. A cult hot hatch." },

  { name:"Seat Ibiza Cupra",            make:"SEAT",         model:"Ibiza Cupra",        era:"1990s",    flag:"🇪🇸", years:"1996–99", country:"Spain",  produced:"~10,000",surviving:"~1,000",value:"£8K–£22K",     rarity:"rare",      hagerty:"",
    desc:"Spain's forgotten hot hatch hero. The 16v 150bhp engine, limited slip differential, and pure driver focus make this an underrated gem." },

  { name:"Ginetta G4",                 make:"Ginetta",      model:"G4",                 era:"1960s",    flag:"🇬🇧", years:"1961–69", country:"UK",     produced:"~500",  surviving:"~350",  value:"£25K–£65K",    rarity:"rare",      hagerty:"",
    desc:"The Walklett brothers' lightweight British sports racer. Ford engine, tubular spaceframe, fibreglass body. A staple of British club racing." },


// ═══════════════════════════════════════════════════════════════════════════
// 200 ADDITIONS — Pre-War through 1990s
// ═══════════════════════════════════════════════════════════════════════════

// ─── PRE-WAR additions ──────────────────────────────────────────────────────

  { name:"Bentley 4¼ Litre",           make:"Bentley",      model:"4¼ Litre",          era:"Pre-War",  flag:"🇬🇧", years:"1936–40", country:"UK",     produced:"~1,200",surviving:"~700",  value:"£150K–£450K",  rarity:"epic",      hagerty:"bentley/4.25_litre/1937/1937-bentley-4.25_litre",
    desc:"The last car designed under W.O. Bentley's direction before Rolls-Royce took over. Often bodied by Park Ward or Vanden Plas. Elegant and capable." },

  { name:"Rolls-Royce Wraith",          make:"Rolls-Royce",  model:"Wraith",            era:"Pre-War",  flag:"🇬🇧", years:"1938–39", country:"UK",     produced:"491",   surviving:"~350",  value:"£120K–£350K",  rarity:"epic",      hagerty:"rolls~royce/wraith/1939/1939-rolls~royce-wraith",
    desc:"The final pre-war Rolls-Royce. A longer, lower chassis than the Phantom III with a new cruciform-braced frame. Often fitted with bodies by Park Ward." },

  { name:"Alfa Romeo 6C 2300",          make:"Alfa Romeo",   model:"6C 2300",           era:"Pre-War",  flag:"🇮🇹", years:"1934–39", country:"Italy",  produced:"~650",  surviving:"~300",  value:"£100K–£350K",  rarity:"epic",      hagerty:"alfa_romeo/6c_2300/1936/1936-alfa_romeo-6c_2300",
    desc:"The successor to the 6C 1750. A refined grand tourer with remarkable coachbuilt bodies. Won the Mille Miglia and was raced by Nuvolari." },

  { name:"Bugatti Type 43",             make:"Bugatti",      model:"Type 43",           era:"Pre-War",  flag:"🇫🇷", years:"1927–31", country:"France", produced:"160",   surviving:"~90",   value:"£400K–£1.2M",  rarity:"epic",      hagerty:"bugatti/type_43/1928/1928-bugatti-type_43",
    desc:"The Type 35B engine in a road-going chassis. The first production car capable of 100mph. Supercharged, dramatic, and enormously desirable." },

  { name:"Bugatti Type 40",             make:"Bugatti",      model:"Type 40",           era:"Pre-War",  flag:"🇫🇷", years:"1926–30", country:"France", produced:"830",   surviving:"~400",  value:"£80K–£200K",   rarity:"rare",      hagerty:"bugatti/type_40/1928/1928-bugatti-type_40",
    desc:"Ettore's 'popular' Bugatti. A four-cylinder touriste with the same beautifully finished chassis as the racing cars. Accessible and charming." },

  { name:"Lancia Lambda",               make:"Lancia",       model:"Lambda",            era:"Pre-War",  flag:"🇮🇹", years:"1922–31", country:"Italy",  produced:"12,999",surviving:"~1,500",value:"£60K–£180K",   rarity:"rare",      hagerty:"lancia/lambda/1926/1926-lancia-lambda",
    desc:"Vincenzo Lancia's revolutionary car. Unitary construction and independent front suspension in 1922. Decades ahead of its time." },

  { name:"Lancia Aprilia",              make:"Lancia",       model:"Aprilia",           era:"Pre-War",  flag:"🇮🇹", years:"1936–50", country:"Italy",  produced:"27,611",surviving:"~2,000",value:"£30K–£90K",    rarity:"rare",      hagerty:"lancia/aprilia/1938/1938-lancia-aprilia",
    desc:"Wind-tunnel designed with a drag coefficient of 0.47 — remarkable for 1936. Pioneered the pillarless four-door body and independent suspension all round." },

  { name:"Alvis 12/50",                 make:"Alvis",        model:"12/50",             era:"Pre-War",  flag:"🇬🇧", years:"1923–32", country:"UK",     produced:"~3,600",surviving:"~500",  value:"£25K–£70K",    rarity:"rare",      hagerty:"",
    desc:"The car that established Alvis as a serious sporting make. Front-wheel drive racing derivatives competed at Le Mans. Charming in touring trim." },

  { name:"Chrysler 300 Letter Series",  make:"Chrysler",     model:"300 Letter",        era:"Pre-War",  flag:"🇺🇸", years:"1955–65", country:"USA",    produced:"~15,000",surviving:"~4,000",value:"£30K–£80K",    rarity:"rare",      hagerty:"chrysler/300/1957/1957-chrysler-300c",
    desc:"The original muscle car. The 300C and 300D with the 392 Hemi dominated NASCAR. America's most powerful production car of the era." },

  { name:"Lincoln Continental Mk2",     make:"Lincoln",      model:"Continental Mk2",   era:"Pre-War",  flag:"🇺🇸", years:"1956–57", country:"USA",    produced:"3,012", surviving:"~1,500",value:"£40K–£100K",   rarity:"epic",      hagerty:"lincoln/continental/1956/1956-lincoln-continental_mark_ii",
    desc:"Priced above a Rolls-Royce at launch. Each car took 60 days to build. Continental's finest hour — pure, understated American luxury." },

  { name:"Cord 810",                    make:"Cord",         model:"810",               era:"Pre-War",  flag:"🇺🇸", years:"1936–37", country:"USA",    produced:"~2,900",surviving:"~800",  value:"£150K–£400K",  rarity:"epic",      hagerty:"cord/810/1936/1936-cord-810",
    desc:"Gordon Buehrig's front-wheel drive masterpiece. Pop-up headlights, coffin-nose grille, supercharged V8. Named the most beautiful car of all time by many." },

  { name:"Duesenberg Model J",          make:"Duesenberg",   model:"Model J",           era:"Pre-War",  flag:"🇺🇸", years:"1928–37", country:"USA",    produced:"~470",  surviving:"~350",  value:"£1.5M–£5M",    rarity:"legendary", hagerty:"duesenberg/model_j/1929/1929-duesenberg-model_j",
    desc:"'It's a Duesy.' The most expensive American car ever built in its era. 265bhp straight-eight, built for Hollywood royalty and industrial magnates." },

// ─── 1950s additions ────────────────────────────────────────────────────────

  { name:"Citroën 2CV",                 make:"Citroën",      model:"2CV",               era:"1950s",    flag:"🇫🇷", years:"1948–90", country:"France", produced:"3.9M",  surviving:"~200K", value:"£5K–£20K",     rarity:"common",    hagerty:"citroen/2cv/1958/1958-citroen-2cv",
    desc:"André Lefèbvre's answer to motorise France on the cheap. Roll-back canvas roof, front-wheel drive, interconnected suspension. Utterly charming." },

  { name:"Jaguar Mk2 3.8",              make:"Jaguar",       model:"Mk2 3.8",           era:"1950s",    flag:"🇬🇧", years:"1959–67", country:"UK",     produced:"~28,000",surviving:"~8,000",value:"£25K–£75K",    rarity:"rare",      hagerty:"jaguar/mk_2/1961/1961-jaguar-mk_2",
    desc:"The bank robbers' and police car. 220bhp, 125mph, wire wheels. Won the British Saloon Car Championship. Arguably the finest saloon of its era." },

  { name:"Jaguar Mk1",                  make:"Jaguar",       model:"Mk1",               era:"1950s",    flag:"🇬🇧", years:"1955–59", country:"UK",     produced:"~37,000",surviving:"~5,000",value:"£18K–£50K",    rarity:"rare",      hagerty:"jaguar/mk_1/1957/1957-jaguar-mk_1",
    desc:"The compact Jaguar saloon that launched the sports saloon concept. The 3.4 version with the XK engine is especially quick and desirable." },

  { name:"Porsche 356 Speedster",       make:"Porsche",      model:"356 Speedster",     era:"1950s",    flag:"🇩🇪", years:"1954–58", country:"Germany",produced:"4,145", surviving:"~2,500",value:"£200K–£600K",  rarity:"epic",      hagerty:"porsche/356_speedster/1956/1956-porsche-356-speedster",
    desc:"Designed for the American market at Max Hoffmann's request. Low windscreen, simple cabin, pure driving. James Dean ordered one shortly before his death." },

  { name:"Porsche Carrera 2 356",       make:"Porsche",      model:"356 Carrera 2",     era:"1950s",    flag:"🇩🇪", years:"1962–65", country:"Germany",produced:"~440",  surviving:"~350",  value:"£400K–£1M",    rarity:"epic",      hagerty:"porsche/356_carrera_2/1963/1963-porsche-356-carrera_2",
    desc:"The final 356 with the four-cam Fuhrmann engine producing 130bhp. A race car in road clothes. Considered the most desirable 356 by collectors." },

  { name:"Mercedes-Benz 220SE Coupé",   make:"Mercedes-Benz",model:"220SE Coupé",       era:"1950s",    flag:"🇩🇪", years:"1958–60", country:"Germany",produced:"~1,900",surviving:"~900",  value:"£60K–£160K",   rarity:"rare",      hagerty:"mercedes~benz/220se/1960/1960-mercedes~benz-220se-coupe",
    desc:"The W128 Ponton-based coupé. Fuel-injected straight-six, pillarless body. One of the most elegant Mercedeses of the postwar era." },

  { name:"Triumph TR3B",                make:"Triumph",      model:"TR3B",              era:"1950s",    flag:"🇬🇧", years:"1962",    country:"UK",     produced:"3,331", surviving:"~1,500",value:"£22K–£55K",    rarity:"rare",      hagerty:"triumph/tr3b/1962/1962-triumph-tr3b",
    desc:"A transitional model built for the American market. Some used the TR4 engine. The rarest of the TR3 family." },

  { name:"Fiat 1100 TV",                make:"Fiat",         model:"1100 TV",           era:"1950s",    flag:"🇮🇹", years:"1953–57", country:"Italy",  produced:"~9,000",surviving:"~1,000",value:"£15K–£40K",    rarity:"rare",      hagerty:"",
    desc:"Fiat's Turismo Veloce — a trim, lively saloon that was raced everywhere. Pininfarina and Ghia bodied many special versions." },

  { name:"Abarth 750 Zagato",           make:"Abarth",       model:"750 Zagato",        era:"1950s",    flag:"🇮🇹", years:"1956–61", country:"Italy",  produced:"~500",  surviving:"~300",  value:"£60K–£160K",   rarity:"rare",      hagerty:"abarth/750/1958/1958-abarth-750",
    desc:"Carlo Abarth's tuned Fiat 600 engine in Zagato's jewel-like double-bubble body. Won its class at the Mille Miglia." },

  { name:"Renault Dauphine Gordini",    make:"Renault",      model:"Dauphine Gordini",  era:"1950s",    flag:"🇫🇷", years:"1957–62", country:"France", produced:"~12,000",surviving:"~500",  value:"£8K–£22K",     rarity:"rare",      hagerty:"renault/dauphine/1958/1958-renault-dauphine-gordini",
    desc:"Amédée Gordini's hot version of the Dauphine. More power, better handling, a competition pedigree. The first Renault hot hatch." },

  { name:"Lancia Flaminia GT",          make:"Lancia",       model:"Flaminia GT",       era:"1950s",    flag:"🇮🇹", years:"1959–67", country:"Italy",  produced:"~4,000",surviving:"~1,500",value:"£60K–£180K",   rarity:"rare",      hagerty:"lancia/flaminia/1960/1960-lancia-flaminia",
    desc:"Touring and Zagato-bodied Lancia GT. The Zagato-bodied Supersport is the rarest and most valuable. A true Italian gran turismo of the era." },

  { name:"Ferrari 250 MM",              make:"Ferrari",      model:"250 MM",            era:"1950s",    flag:"🇮🇹", years:"1952–53", country:"Italy",  produced:"31",    surviving:"~28",   value:"£8M–£18M",     rarity:"legendary", hagerty:"ferrari/250_mm/1953/1953-ferrari-250_mm",
    desc:"Mille Miglia winner. Vignale and Pinin Farina bodies on a 250 Sport chassis. The direct ancestor of the 250 GT series. Magnificent." },

  { name:"Alfa Romeo Tipo 159",         make:"Alfa Romeo",   model:"Tipo 159 Alfetta",  era:"1950s",    flag:"🇮🇹", years:"1951",    country:"Italy",  produced:"~10",   surviving:"~5",    value:"£10M+",        rarity:"legendary", hagerty:"",
    desc:"Fangio's 1951 World Championship car. A pre-war design with a 1.5-litre supercharged straight-eight producing 425bhp. One of the great Grand Prix cars." },

  { name:"BRM P25",                     make:"BRM",          model:"P25",               era:"1950s",    flag:"🇬🇧", years:"1955–60", country:"UK",     produced:"~12",   surviving:"~8",    value:"£2M–£5M",      rarity:"legendary", hagerty:"",
    desc:"Britain's great hope for a home-grown world championship. The supercharged V16 P15 evolved into the naturally-aspirated P25 that finally delivered results." },

// ─── 1960s additions ────────────────────────────────────────────────────────

  { name:"Jaguar E-Type Series 1 4.2",  make:"Jaguar",       model:"E-Type 4.2",        era:"1960s",    flag:"🇬🇧", years:"1964–68", country:"UK",     produced:"~9,000",surviving:"~5,000",value:"£70K–£160K",   rarity:"rare",      hagerty:"jaguar/e~type/1965/1965-jaguar-e~type-4.2",
    desc:"The longer-stroke 4.2-litre XK engine with a better gearbox. The most usable early E-Type. Often considered the best of the first series." },

  { name:"Aston Martin DBS",            make:"Aston Martin", model:"DBS",               era:"1960s",    flag:"🇬🇧", years:"1967–72", country:"UK",     produced:"787",   surviving:"~600",  value:"£80K–£200K",   rarity:"rare",      hagerty:"aston_martin/dbs/1968/1968-aston_martin-dbs",
    desc:"The wider-bodied Aston designed to house the new V8 engine. The inline-six version is often overlooked — and therefore excellent value." },

  { name:"Aston Martin DBS V8",         make:"Aston Martin", model:"DBS V8",            era:"1960s",    flag:"🇬🇧", years:"1969–72", country:"UK",     produced:"~400",  surviving:"~320",  value:"£150K–£400K",  rarity:"epic",      hagerty:"aston_martin/dbs/1970/1970-aston_martin-dbs_v8",
    desc:"The first Aston Martin with the new 5.3-litre quad-cam V8. A landmark in the company's history. Carburetted and glorious." },

  { name:"Ferrari 166 MM",              make:"Ferrari",      model:"166 MM",            era:"1960s",    flag:"🇮🇹", years:"1948–53", country:"Italy",  produced:"39",    surviving:"~30",   value:"£8M–£20M",     rarity:"legendary", hagerty:"ferrari/166_mm/1950/1950-ferrari-166_mm",
    desc:"The Mille Miglia Barchetta. Won Le Mans and the Mille Miglia in 1949. Touring's open body is among the most beautiful ever built. A foundation of Ferrari." },

  { name:"Ferrari 250 GT Cabriolet",    make:"Ferrari",      model:"250 GT Cabriolet",  era:"1960s",    flag:"🇮🇹", years:"1957–65", country:"Italy",  produced:"~240",  surviving:"~200",  value:"£600K–£1.5M",  rarity:"legendary", hagerty:"ferrari/250_gt/1962/1962-ferrari-250_gt-cabriolet",
    desc:"Pininfarina's open 250 GT. Series II cars from 1959 are the most elegant. A glorious way to experience the 250 in open-air splendour." },

  { name:"Ferrari 212 Inter",           make:"Ferrari",      model:"212 Inter",         era:"1960s",    flag:"🇮🇹", years:"1951–53", country:"Italy",  produced:"~90",   surviving:"~70",   value:"£1.5M–£4M",    rarity:"legendary", hagerty:"ferrari/212_inter/1952/1952-ferrari-212_inter",
    desc:"Ferrari's first series-produced road car. Coachbuilt by Vignale, Ghia, and Touring. Each example unique. The car that established Ferrari's road car reputation." },

  { name:"Lamborghini 400GT 2+2",       make:"Lamborghini",  model:"400GT 2+2",         era:"1960s",    flag:"🇮🇹", years:"1966–68", country:"Italy",  produced:"247",   surviving:"~200",  value:"£300K–£700K",  rarity:"epic",      hagerty:"lamborghini/400gt/1967/1967-lamborghini-400gt",
    desc:"The 2+2 version of the 350GT with a larger 4.0-litre V12. Touring of Milan body, two small rear seats. The first truly usable Lamborghini." },

  { name:"Maserati Mistral",            make:"Maserati",     model:"Mistral",           era:"1960s",    flag:"🇮🇹", years:"1963–70", country:"Italy",  produced:"948",   surviving:"~700",  value:"£100K–£280K",  rarity:"epic",      hagerty:"maserati/mistral/1965/1965-maserati-mistral",
    desc:"Frua's last great Maserati design. The Spyder is the rarest version. A straight-six grand tourer that's been overlooked and is now rising sharply." },

  { name:"Maserati Sebring",            make:"Maserati",     model:"Sebring",           era:"1960s",    flag:"🇮🇹", years:"1962–66", country:"Italy",  produced:"348",   surviving:"~250",  value:"£120K–£300K",  rarity:"epic",      hagerty:"maserati/sebring/1963/1963-maserati-sebring",
    desc:"Vignale-bodied 2+2 on the 3500GT chassis. Elegant, understated, and powered by a magnificent straight-six. The Gran Turismo Maserati par excellence." },

  { name:"Maserati Khamsin",            make:"Maserati",     model:"Khamsin",           era:"1960s",    flag:"🇮🇹", years:"1974–82", country:"Italy",  produced:"435",   surviving:"~320",  value:"£80K–£200K",   rarity:"rare",      hagerty:"maserati/khamsin/1975/1975-maserati-khamsin",
    desc:"Bertone designed the Khamsin — possibly the most beautiful front-engined Maserati. The hydraulic steering and pedals are remarkable and very Italian." },

  { name:"De Tomaso Pantera",           make:"De Tomaso",    model:"Pantera",           era:"1960s",    flag:"🇮🇹", years:"1971–92", country:"Italy",  produced:"~7,260",surviving:"~5,000",value:"£80K–£200K",   rarity:"rare",      hagerty:"de_tomaso/pantera/1972/1972-de_tomaso-pantera",
    desc:"Ghia body, mid-mounted Ford Cleveland V8. Sold through Lincoln-Mercury dealers. Elvis shot his when it wouldn't start. Enormous performance and character." },

  { name:"Ford Cortina Mk1 Lotus",      make:"Ford",         model:"Cortina Lotus",     era:"1960s",    flag:"🇬🇧", years:"1963–66", country:"UK",     produced:"3,306", surviving:"~1,000",value:"£35K–£80K",    rarity:"rare",      hagerty:"ford/cortina/1964/1964-ford-cortina-lotus",
    desc:"Colin Chapman and Jim Clark's joint venture. Lotus twin-cam, Cosworth-tuned, lightweight. Won everything in saloon car racing. A genuine icon." },

  { name:"Ford Falcon GT",              make:"Ford",         model:"Falcon GT",         era:"1960s",    flag:"🇦🇺", years:"1967–76", country:"Australia",produced:"~20,000",surviving:"~5,000",value:"£25K–£80K",  rarity:"rare",      hagerty:"ford/falcon/1969/1969-ford-falcon-gt",
    desc:"Australia's great touring car racing champion. The XY GTHO Phase III is considered among the world's fastest production cars of 1971." },

  { name:"Porsche 912",                 make:"Porsche",      model:"912",               era:"1960s",    flag:"🇩🇪", years:"1965–69", country:"Germany",produced:"32,099",surviving:"~15,000",value:"£35K–£80K",   rarity:"rare",      hagerty:"porsche/912/1966/1966-porsche-912",
    desc:"The 911 body with a four-cylinder engine. Lighter and more balanced than the 911. Now appreciated for exactly those qualities." },

  { name:"Porsche 914/6",               make:"Porsche",      model:"914/6",             era:"1960s",    flag:"🇩🇪", years:"1969–72", country:"Germany",produced:"3,338", surviving:"~2,000",value:"£80K–£200K",   rarity:"rare",      hagerty:"porsche/914/1971/1971-porsche-914-6",
    desc:"The six-cylinder version of the mid-engined 914 with the 911S engine. Faster than the contemporary 911T. Only 3,338 built." },

  { name:"BMW 2000CS",                  make:"BMW",          model:"2000CS",            era:"1960s",    flag:"🇩🇪", years:"1965–69", country:"Germany",produced:"11,720",surviving:"~3,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"bmw/2000cs/1967/1967-bmw-2000cs",
    desc:"Karmann-built coupé body on the New Class chassis. The inline-four carburetted grand tourer that led to the E9 3.0 CSL." },

  { name:"BMW 3.0 CSL",                 make:"BMW",          model:"3.0 CSL",           era:"1960s",    flag:"🇩🇪", years:"1971–75", country:"Germany",produced:"1,265", surviving:"~600",  value:"£200K–£600K",  rarity:"epic",      hagerty:"bmw/3.0_csl/1972/1972-bmw-3.0_csl",
    desc:"Coupe Sport Leichtbau. Aluminium doors, bonnet, and boot. The massive aerodynamic batmobile kit was optional but irresistible." },

  { name:"BMW 2800CS",                  make:"BMW",          model:"2800CS",            era:"1960s",    flag:"🇩🇪", years:"1968–71", country:"Germany",produced:"9,399", surviving:"~2,500",value:"£25K–£65K",    rarity:"rare",      hagerty:"bmw/2800cs/1969/1969-bmw-2800cs",
    desc:"The E9 coupé with the 2.8-litre straight-six. Longer, wider, more elegant than the 2000CS it replaced. Timeless Karmann coachwork." },

  { name:"Chevrolet Corvette C2 Stingray",make:"Chevrolet",  model:"Corvette C2",       era:"1960s",    flag:"🇺🇸", years:"1963–67", country:"USA",    produced:"117,964",surviving:"~40,000",value:"£40K–£120K",  rarity:"rare",      hagerty:"chevrolet/corvette/1964/1964-chevrolet-corvette",
    desc:"The Sting Ray coupé with the split rear window is the most iconic American car of the 1960s. The Big Block 427 version is devastating." },

  { name:"Pontiac Firebird Trans Am",   make:"Pontiac",      model:"Firebird Trans Am",  era:"1960s",   flag:"🇺🇸", years:"1969–81", country:"USA",    produced:"~640,000",surviving:"~80,000",value:"£20K–£60K",  rarity:"rare",      hagerty:"pontiac/firebird/1969/1969-pontiac-firebird-trans_am",
    desc:"The T/A with the 400ci Ram Air engine. Burt Reynolds and Smokey and the Bandit made the 1977 version iconic. A defining piece of American culture." },

  { name:"Buick Riviera 1st Gen",       make:"Buick",        model:"Riviera",           era:"1960s",    flag:"🇺🇸", years:"1963–65", country:"USA",    produced:"~112,000",surviving:"~20,000",value:"£15K–£45K",  rarity:"rare",      hagerty:"buick/riviera/1964/1964-buick-riviera",
    desc:"Bill Mitchell's masterpiece. The cleanest, most elegant American car of the 1960s. The 1963 original with no chrome ornamentation is the purest." },

  { name:"Oldsmobile Toronado",         make:"Oldsmobile",   model:"Toronado",          era:"1960s",    flag:"🇺🇸", years:"1966–70", country:"USA",    produced:"~142,000",surviving:"~15,000",value:"£18K–£50K",  rarity:"rare",      hagerty:"oldsmobile/toronado/1967/1967-oldsmobile-toronado",
    desc:"America's first front-wheel drive production car since 1937. A massive 7.0-litre V8 sending power to the front wheels. Audacious." },

  { name:"Alfa Romeo Giulia Saloon",    make:"Alfa Romeo",   model:"Giulia 1300 TI",    era:"1960s",    flag:"🇮🇹", years:"1962–78", country:"Italy",  produced:"~574,000",surviving:"~30,000",value:"£8K–£25K",   rarity:"common",    hagerty:"alfa_romeo/giulia/1965/1965-alfa_romeo-giulia",
    desc:"The definitive Italian sports saloon. Twin-cam, five-speed, rear-wheel drive in a small, light body. Used by police, beloved by enthusiasts." },

  { name:"Alfa Romeo 33 Stradale",      make:"Alfa Romeo",   model:"33 Stradale",       era:"1960s",    flag:"🇮🇹", years:"1967–69", country:"Italy",  produced:"18",    surviving:"12",    value:"£15M+",        rarity:"legendary", hagerty:"",
    desc:"Only 18 built. The Tipo 33 race car's V8 in Scaglione's breathtaking body. One of the most beautiful road cars in existence." },

  { name:"Triumph TR4A",                make:"Triumph",      model:"TR4A",              era:"1960s",    flag:"🇬🇧", years:"1965–67", country:"UK",     produced:"28,465",surviving:"~8,000",value:"£18K–£48K",    rarity:"rare",      hagerty:"triumph/tr4a/1966/1966-triumph-tr4a",
    desc:"The TR4 with independent rear suspension. More refined, better handling. Transitional car between the old TRs and the TR6 era." },

  { name:"Honda S600",                  make:"Honda",        model:"S600",              era:"1960s",    flag:"🇯🇵", years:"1964–66", country:"Japan",  produced:"13,084",surviving:"~2,000",value:"£18K–£50K",    rarity:"rare",      hagerty:"honda/s600/1965/1965-honda-s600",
    desc:"Honda's first road car, chain-driven like the S800. 9,500rpm from a 600cc four-cylinder. A mechanical masterpiece of miniaturisation." },

  { name:"Mazda Cosmo Sport",           make:"Mazda",        model:"Cosmo Sport",       era:"1960s",    flag:"🇯🇵", years:"1967–72", country:"Japan",  produced:"1,176", surviving:"~400",  value:"£80K–£200K",   rarity:"epic",      hagerty:"mazda/cosmo/1967/1967-mazda-cosmo",
    desc:"The world's first twin-rotor Wankel production car. A futuristic coupé that launched Mazda's rotary legacy. Deeply rare and historically significant." },

  { name:"Toyota 2000GT",               make:"Toyota",       model:"2000GT",            era:"1960s",    flag:"🇯🇵", years:"1967–70", country:"Japan",  produced:"351",   surviving:"~300",  value:"£600K–£1.5M",  rarity:"legendary", hagerty:"toyota/2000gt/1968/1968-toyota-2000gt",
    desc:"Japan's first supercar. Yamaha-designed twin-cam six, stunning Albrecht Goertz body. Only 351 built. James Bond drove a converted roadster version." },

  { name:"Lotus Cortina Mk2",           make:"Ford",         model:"Lotus Cortina Mk2", era:"1960s",    flag:"🇬🇧", years:"1967–70", country:"UK",     produced:"4,032", surviving:"~1,000",value:"£25K–£60K",    rarity:"rare",      hagerty:"ford/cortina/1968/1968-ford-cortina-lotus",
    desc:"The Mk2 Lotus Cortina was built by Ford rather than Lotus. Less special than the Mk1 but more reliable and still very fast." },

  { name:"Reliant Scimitar GTE",        make:"Reliant",      model:"Scimitar GTE",      era:"1960s",    flag:"🇬🇧", years:"1968–86", country:"UK",     produced:"~15,000",surviving:"~5,000",value:"£5K–£18K",     rarity:"common",    hagerty:"reliant/scimitar/1970/1970-reliant-scimitar",
    desc:"The original sporting estate. Princess Anne owned seven. A Ford V6 in a fibreglass body. Invented a segment that no one else ever properly exploited." },

// ─── 70s–80s additions ──────────────────────────────────────────────────────

  { name:"Porsche 911 Carrera RS 2.7",  make:"Porsche",      model:"911 Carrera RS 2.7",era:"70s–80s",  flag:"🇩🇪", years:"1972–73", country:"Germany",produced:"1,580", surviving:"~1,300",value:"£600K–£1.5M",  rarity:"legendary", hagerty:"porsche/911_carrera_rs/1973/1973-porsche-911_carrera_rs",
    desc:"The definitive early 911. Ducktail spoiler, Touring or Lightweight specification. The car every 911 purist wants. Values have never looked back." },

  { name:"Porsche 911 Carrera 3.2",     make:"Porsche",      model:"911 Carrera 3.2",   era:"70s–80s",  flag:"🇩🇪", years:"1983–89", country:"Germany",produced:"~76,000",surviving:"~40,000",value:"£35K–£85K",   rarity:"rare",      hagerty:"porsche/911/1985/1985-porsche-911-carrera",
    desc:"The last air-cooled 911 before the 964. Dependable, characterful, 231bhp. Club Sport version is lighter and more focused. Values rising steadily." },

  { name:"Ferrari 308 GT4 Dino",        make:"Ferrari",      model:"308 GT4 Dino",      era:"70s–80s",  flag:"🇮🇹", years:"1974–76", country:"Italy",  produced:"~2,400",surviving:"~2,000",value:"£35K–£70K",    rarity:"rare",      hagerty:"ferrari/308_gt4/1975/1975-ferrari-308_gt4",
    desc:"The early Dino-badged 308 GT4. Bertone's angular 2+2 coupé on the 246's wheelbase. Often overlooked but a genuine Ferrari to drive." },

  { name:"Ferrari 365 GTC/4",           make:"Ferrari",      model:"365 GTC/4",         era:"70s–80s",  flag:"🇮🇹", years:"1971–72", country:"Italy",  produced:"500",   surviving:"~450",  value:"£250K–£600K",  rarity:"epic",      hagerty:"ferrari/365_gtc!4/1972/1972-ferrari-365_gtc!4",
    desc:"Ferrari's 2+2 grand tourer. Six Webers, quad-cam V12, gorgeous Pininfarina body. Replaced the 365 GT 2+2 and pointed toward the 365 GT4 BB." },

  { name:"Maserati Quattroporte II",    make:"Maserati",     model:"Quattroporte II",   era:"70s–80s",  flag:"🇮🇹", years:"1974–78", country:"Italy",  produced:"13",    surviving:"~10",   value:"£100K–£300K",  rarity:"legendary", hagerty:"",
    desc:"Only 13 built by Bertone. An ultra-rare four-door Maserati with a V6 engine. Absurdly rare and historically significant." },

  { name:"Maserati Quattroporte III",   make:"Maserati",     model:"Quattroporte III",  era:"70s–80s",  flag:"🇮🇹", years:"1979–90", country:"Italy",  produced:"~2,100",surviving:"~1,000",value:"£25K–£70K",    rarity:"rare",      hagerty:"maserati/quattroporte/1982/1982-maserati-quattroporte",
    desc:"Giugiaro's four-door Maserati. V8 engine with a five-speed manual or automatic. A genuine fast saloon car with impeccable Italian presence." },

  { name:"Lamborghini Jalpa",           make:"Lamborghini",  model:"Jalpa",             era:"70s–80s",  flag:"🇮🇹", years:"1981–88", country:"Italy",  produced:"410",   surviving:"~350",  value:"£80K–£200K",   rarity:"rare",      hagerty:"lamborghini/jalpa/1983/1983-lamborghini-jalpa",
    desc:"The Urraco's successor with a 3.5-litre V8. Bertone-styled targa top. Thomas Magnum drove one. More usable than the Countach, more exotic than a Ferrari 308." },

  { name:"Mercedes-Benz 450SEL 6.9",    make:"Mercedes-Benz",model:"450SEL 6.9",        era:"70s–80s",  flag:"🇩🇪", years:"1975–80", country:"Germany",produced:"7,380", surviving:"~2,500",value:"£30K–£80K",    rarity:"rare",      hagerty:"mercedes~benz/450sel_6.9/1977/1977-mercedes~benz-450sel_6.9",
    desc:"The world's fastest production saloon in 1975. Hydraulic self-levelling suspension, 6.9-litre V8. Preferred by heads of state over Rolls-Royce." },

  { name:"Mercedes-Benz 300CE AMG",     make:"Mercedes-Benz",model:"300CE AMG",         era:"70s–80s",  flag:"🇩🇪", years:"1988–92", country:"Germany",produced:"~1,000",surviving:"~600",  value:"£20K–£55K",    rarity:"rare",      hagerty:"mercedes~benz/300ce/1990/1990-mercedes~benz-300ce",
    desc:"The W124 coupé with AMG upgrades — wider arches, 3.4-litre engine, sports suspension. The Hammer of its day. Rare and increasingly sought-after." },

  { name:"BMW E30 325i",                make:"BMW",          model:"325i E30",          era:"70s–80s",  flag:"🇩🇪", years:"1985–92", country:"Germany",produced:"~400,000",surviving:"~60,000",value:"£12K–£35K",  rarity:"common",    hagerty:"bmw/3_series/1987/1987-bmw-325i",
    desc:"The quintessential driver's car. 2.5-litre straight-six, rear-wheel drive, near-perfect balance. The foundation of BMW's sporting reputation." },

  { name:"BMW E30 Cabriolet",           make:"BMW",          model:"E30 Cabriolet",     era:"70s–80s",  flag:"🇩🇪", years:"1985–93", country:"Germany",produced:"~142,000",surviving:"~40,000",value:"£12K–£35K",  rarity:"common",    hagerty:"bmw/3_series/1988/1988-bmw-325i-convertible",
    desc:"The E30 convertible — lightweight, elegant, and deeply usable. The 325i Cabriolet is the one to have. Hugely popular and rising in value." },

  { name:"BMW 850CSi",                  make:"BMW",          model:"850CSi",            era:"70s–80s",  flag:"🇩🇪", years:"1992–96", country:"Germany",produced:"1,510", surviving:"~1,200",value:"£50K–£130K",   rarity:"rare",      hagerty:"bmw/8_series/1993/1993-bmw-850csi",
    desc:"The M-tuned S70 V12 in the E31 coupé body. Limited-slip diff, sports suspension, unique front bumper. The rarest and most desirable 8-series." },

  { name:"Volkswagen Golf GTI Mk3",     make:"Volkswagen",   model:"Golf GTI Mk3",      era:"70s–80s",  flag:"🇩🇪", years:"1991–98", country:"Germany",produced:"~150,000",surviving:"~15,000",value:"£8K–£22K",    rarity:"rare",      hagerty:"volkswagen/golf/1992/1992-volkswagen-golf-gti",
    desc:"Heavier but more refined than the Mk2. The VR6 version is the enthusiast's choice. Now genuinely rare in good condition." },

  { name:"Ford Escort RS Turbo S2",     make:"Ford",         model:"Escort RS Turbo",   era:"70s–80s",  flag:"🇬🇧", years:"1986–90", country:"UK",     produced:"~8,600",surviving:"~1,500",value:"£15K–£45K",    rarity:"rare",      hagerty:"ford/escort/1987/1987-ford-escort-rs_turbo",
    desc:"The S2 RS Turbo with its Dunton-developed engine. White only until 1988, then other colours. Turbocharged Escort performance made accessible." },

  { name:"Ford Escort Cosworth",        make:"Ford",         model:"Escort Cosworth",   era:"70s–80s",  flag:"🇬🇧", years:"1992–96", country:"UK",     produced:"~7,000",surviving:"~3,000",value:"£25K–£65K",    rarity:"rare",      hagerty:"ford/escort/1993/1993-ford-escort-cosworth",
    desc:"The big whale-tail Escort. YB turbocharged Cosworth engine, Zeta 4WD system. Won in the WRC. The final hurrah of homologation hot Escorts." },

  { name:"Vauxhall Astra GTE Mk2",      make:"Vauxhall",     model:"Astra GTE",         era:"70s–80s",  flag:"🇬🇧", years:"1984–91", country:"UK",     produced:"~40,000",surviving:"~2,000",value:"£10K–£30K",   rarity:"rare",      hagerty:"vauxhall/astra/1986/1986-vauxhall-astra-gte",
    desc:"The hot Astra that brought Opel's motorsport pedigree to Britain. The 16-valve version from 1988 is the one to have." },

  { name:"Alfa Romeo 75 Turbo Evoluzione",make:"Alfa Romeo", model:"75 Turbo Evoluzione",era:"70s–80s", flag:"🇮🇹", years:"1987–88", country:"Italy",  produced:"500",   surviving:"~350",  value:"£25K–£65K",    rarity:"rare",      hagerty:"alfa_romeo/75/1988/1988-alfa_romeo-75-turbo",
    desc:"500 built for WTCC homologation. Turbocharged 1.8-litre, stripped interior, widened arches. A brilliant and dangerous race car for the road." },

  { name:"Alfa Romeo SZ",               make:"Alfa Romeo",   model:"SZ",                era:"70s–80s",  flag:"🇮🇹", years:"1989–91", country:"Italy",  produced:"1,036", surviving:"~900",  value:"£40K–£100K",   rarity:"rare",      hagerty:"alfa_romeo/sz/1990/1990-alfa_romeo-sz",
    desc:"The Sprint Zagato on the 75 platform. 210bhp V6, plastic body panels, outrageous styling. Love it or hate it — but you can't ignore it." },

  { name:"Renault GTA V6 Turbo",        make:"Renault",      model:"GTA V6 Turbo",      era:"70s–80s",  flag:"🇫🇷", years:"1985–91", country:"France", produced:"~9,000",surviving:"~3,000",value:"£15K–£45K",    rarity:"rare",      hagerty:"renault/gta/1987/1987-renault-gta_v6_turbo",
    desc:"The mid-engined rear-wheel drive V6 turbo GT. 200bhp, plastic body, spine-tingling balance. Torsten Flodstrand raced one in the WRC." },

  { name:"Citroën SM",                  make:"Citroën",      model:"SM",                era:"70s–80s",  flag:"🇫🇷", years:"1970–75", country:"France", produced:"12,920",surviving:"~4,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"citroen/sm/1972/1972-citroen-sm",
    desc:"The Citroën DS with a Maserati V6. Hydropneumatic suspension, power steering centred on straight-ahead. The most exotic French car of its era." },

  { name:"Citroën DS23 Pallas",         make:"Citroën",      model:"DS23 Pallas",       era:"70s–80s",  flag:"🇫🇷", years:"1972–75", country:"France", produced:"~50,000",surviving:"~10,000",value:"£18K–£50K",    rarity:"rare",      hagerty:"citroen/ds/1974/1974-citroen-ds23",
    desc:"The top-of-the-range DS with 5-speed injection. Swivelling headlights, magic-carpet ride, presidential-quality presence." },

  { name:"Pantera GTS",                 make:"De Tomaso",    model:"Pantera GTS",       era:"70s–80s",  flag:"🇮🇹", years:"1972–74", country:"Italy",  produced:"~200",  surviving:"~150",  value:"£120K–£280K",  rarity:"epic",      hagerty:"de_tomaso/pantera_gts/1973/1973-de_tomaso-pantera_gts",
    desc:"The factory racing version of the Pantera. Wide arches, massive wheels, 350bhp. The ultimate expression of the Ford-Maserati-Italy collaboration." },

  { name:"Triumph Acclaim",             make:"Triumph",      model:"Acclaim",           era:"70s–80s",  flag:"🇬🇧", years:"1981–84", country:"UK",     produced:"133,625",surviving:"~2,000",value:"£2K–£8K",      rarity:"common",    hagerty:"",
    desc:"The last Triumph. A Honda Ballade in British clothes, built to save Rover Group. Reliable, practical, and the end of an era." },

  { name:"Lancia Fulvia HF",            make:"Lancia",       model:"Fulvia HF",         era:"70s–80s",  flag:"🇮🇹", years:"1968–76", country:"Italy",  produced:"~7,000",surviving:"~2,500",value:"£30K–£80K",    rarity:"rare",      hagerty:"lancia/fulvia/1969/1969-lancia-fulvia",
    desc:"Won the World Rally Championship in 1972. The 1.6 HF is the ultimate Fulvia — narrow-angle V4, front-wheel drive, flat floor. An Italian jewel." },

  { name:"Lotus Elite Type 14",         make:"Lotus",        model:"Elite",             era:"70s–80s",  flag:"🇬🇧", years:"1957–63", country:"UK",     produced:"1,030", surviving:"~600",  value:"£50K–£120K",   rarity:"rare",      hagerty:"lotus/elite/1960/1960-lotus-elite",
    desc:"The first all-fibreglass monocoque production car. Coventry Climax engine, aerodynamic body, minimal weight. Advanced and fragile in equal measure." },

  { name:"Lotus Elite S2 Type 75",      make:"Lotus",        model:"Elite S2",          era:"70s–80s",  flag:"🇬🇧", years:"1974–80", country:"UK",     produced:"2,535", surviving:"~1,200",value:"£12K–£35K",    rarity:"rare",      hagerty:"lotus/elite/1975/1975-lotus-elite",
    desc:"The second Lotus Elite — a 2+2 hatchback with a Lotus 907 engine. Practical, fast, and remarkably innovative for its time." },

  { name:"TVR S Series",                make:"TVR",          model:"S Series",          era:"70s–80s",  flag:"🇬🇧", years:"1986–94", country:"UK",     produced:"~2,750",surviving:"~1,800",value:"£10K–£28K",    rarity:"rare",      hagerty:"tvr/s_series/1988/1988-tvr-s_series",
    desc:"The affordable TVR roadster with a Ford V6. Lightweight fibreglass, traditional styling. A straightforward British sports car that delivered genuine enjoyment." },

  { name:"Mitsubishi Starion Turbo",    make:"Mitsubishi",   model:"Starion Turbo",     era:"70s–80s",  flag:"🇯🇵", years:"1982–90", country:"Japan",  produced:"~70,000",surviving:"~10,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"mitsubishi/starion/1984/1984-mitsubishi-starion",
    desc:"Turbocharged rear-wheel drive Japanese GT coupé. 200bhp, pop-up headlights, wide arches on the later WSX. Japan's answer to the Porsche 944." },

  { name:"Mazda RX-7 SA22C",           make:"Mazda",        model:"RX-7 SA22C",        era:"70s–80s",  flag:"🇯🇵", years:"1978–85", country:"Japan",  produced:"~474,000",surviving:"~50,000",value:"£15K–£40K",  rarity:"rare",      hagerty:"mazda/rx~7/1979/1979-mazda-rx~7",
    desc:"The first RX-7. Near-perfect 50:50 weight distribution, rotary smoothness, pop-up headlights. One of the best-handling sports cars of its era." },

  { name:"Mazda RX-7 FC",              make:"Mazda",        model:"RX-7 FC",           era:"70s–80s",  flag:"🇯🇵", years:"1985–92", country:"Japan",  produced:"~272,000",surviving:"~50,000",value:"£18K–£45K",  rarity:"rare",      hagerty:"mazda/rx~7/1987/1987-mazda-rx~7",
    desc:"The second-generation RX-7. Turbocharged from 1986, Porsche 944-rivalling dynamics. The convertible version is now very rare and sought-after." },

  { name:"Isuzu Piazza Turbo",          make:"Isuzu",        model:"Piazza Turbo",      era:"70s–80s",  flag:"🇯🇵", years:"1981–90", country:"Japan",  produced:"~50,000",surviving:"~5,000",value:"£8K–£22K",    rarity:"rare",      hagerty:"",
    desc:"Giugiaro's last great Japanese design commission. Turbocharged Lotus-developed 2.0-litre, rear-wheel drive. A forgotten Japanese GT gem." },

  { name:"Jaguar XJ12",                 make:"Jaguar",       model:"XJ12",              era:"70s–80s",  flag:"🇬🇧", years:"1972–96", country:"UK",     produced:"~50,000",surviving:"~8,000",value:"£12K–£40K",   rarity:"rare",      hagerty:"jaguar/xj12/1973/1973-jaguar-xj12",
    desc:"The ultimate XJ with the 5.3-litre V12. The smoothest and most refined Jaguar ever built. William Lyons called it his finest achievement." },

  { name:"Aston Martin V8 Saloon",      make:"Aston Martin", model:"V8 Saloon",         era:"70s–80s",  flag:"🇬🇧", years:"1972–89", country:"UK",     produced:"~1,700",surviving:"~1,400",value:"£80K–£200K",   rarity:"rare",      hagerty:"aston_martin/v8/1976/1976-aston_martin-v8",
    desc:"The bread-and-butter Aston V8 saloon. 5.3-litre quad-cam engine, Newport Pagnell hand-built. Oscar-India version from 1978 is particularly desirable." },

// ─── 1990s additions ────────────────────────────────────────────────────────

  { name:"Ferrari 575M Maranello",      make:"Ferrari",      model:"575M Maranello",    era:"1990s",    flag:"🇮🇹", years:"2002–06", country:"Italy",  produced:"2,056", surviving:"~1,800",value:"£100K–£200K",  rarity:"rare",      hagerty:"ferrari/575m_maranello/2003/2003-ferrari-575m_maranello",
    desc:"The 550 with a larger V12 and optional F1 paddle-shift gearbox. The Fiorano package with carbon-ceramic brakes is the driver's choice." },

  { name:"Ferrari 348 Spider",          make:"Ferrari",      model:"348 Spider",        era:"1990s",    flag:"🇮🇹", years:"1993–95", country:"Italy",  produced:"1,090", surviving:"~950",  value:"£60K–£120K",   rarity:"rare",      hagerty:"ferrari/348/1994/1994-ferrari-348_spider",
    desc:"The open version of the 348 arrived just as the model was ending. Rarer than the tb/ts and now the most desirable 348." },

  { name:"Ferrari 456M GTA",            make:"Ferrari",      model:"456M GTA",          era:"1990s",    flag:"🇮🇹", years:"1996–2003",country:"Italy",  produced:"~1,500",surviving:"~1,300",value:"£65K–£140K",   rarity:"rare",      hagerty:"ferrari/456_m/1998/1998-ferrari-456_m-gta",
    desc:"The automatic-gearbox 456. Grand Tourer at its most comfortable. Imperious V12, effortless pace, room for four." },

  { name:"Porsche 911 GT2 996",         make:"Porsche",      model:"996 GT2",           era:"1990s",    flag:"🇩🇪", years:"2001–05", country:"Germany",produced:"~1,300",surviving:"~1,100",value:"£80K–£180K",   rarity:"rare",      hagerty:"porsche/996/2002/2002-porsche-996-gt2",
    desc:"The water-cooled widowmaker. 462bhp twin-turbo, rear-drive, no traction control until 2004. Ferociously fast and deeply serious." },

  { name:"Porsche 993 Carrera S",       make:"Porsche",      model:"993 Carrera S",     era:"1990s",    flag:"🇩🇪", years:"1997–98", country:"Germany",produced:"~3,800",surviving:"~3,000",value:"£80K–£160K",   rarity:"rare",      hagerty:"porsche/993/1997/1997-porsche-993-carrera_s",
    desc:"The narrow-body 993 with the Turbo's wide-body arches but the naturally-aspirated engine. The best of both worlds in the final air-cooled 911." },

  { name:"Porsche Boxster 986",         make:"Porsche",      model:"Boxster 986",       era:"1990s",    flag:"🇩🇪", years:"1996–04", country:"Germany",produced:"~132,000",surviving:"~60,000",value:"£8K–£22K",    rarity:"common",    hagerty:"porsche/boxster/1997/1997-porsche-boxster",
    desc:"The mid-engined roadster that saved Porsche. Brilliant handling, beautiful proportions, affordable to own. One of the great driver's cars." },

  { name:"Jaguar XJ8",                  make:"Jaguar",       model:"XJ8",               era:"1990s",    flag:"🇬🇧", years:"1997–2003",country:"UK",    produced:"~85,000",surviving:"~30,000",value:"£5K–£18K",    rarity:"common",    hagerty:"jaguar/xj8/1998/1998-jaguar-xj8",
    desc:"The V8-engined XJ. Beautifully resolved traditional styling with modern underpinnings. Supremely comfortable and surprisingly fast." },

  { name:"Aston Martin DB7 Zagato",     make:"Aston Martin", model:"DB7 Zagato",        era:"1990s",    flag:"🇬🇧", years:"2002–03", country:"UK",     produced:"99",    surviving:"~90",   value:"£200K–£450K",  rarity:"epic",      hagerty:"aston_martin/db7_zagato/2003/2003-aston_martin-db7_zagato",
    desc:"Only 99 built for the DB7's final chapter. Zagato's double-bubble roof and bespoke bodywork over the Vantage drivetrain. An instant collector's piece." },

  { name:"McLaren F1 GTR",              make:"McLaren",      model:"F1 GTR",            era:"1990s",    flag:"🇬🇧", years:"1995–97", country:"UK",     produced:"28",    surviving:"~25",   value:"£20M+",        rarity:"legendary", hagerty:"",
    desc:"The race version of the F1 that won Le Mans overall in 1995 at its first attempt, against purpose-built prototypes. Among the greatest racing cars ever built." },

  { name:"Lamborghini Diablo SV",       make:"Lamborghini",  model:"Diablo SV",         era:"1990s",    flag:"🇮🇹", years:"1995–98", country:"Italy",  produced:"346",   surviving:"~300",  value:"£200K–£450K",  rarity:"epic",      hagerty:"lamborghini/diablo/1996/1996-lamborghini-diablo_sv",
    desc:"Sport Veloce — the Diablo without AWD but with race-tuned suspension and 510bhp. The driver's Diablo, and the most raw." },

  { name:"Lamborghini Diablo VT",       make:"Lamborghini",  model:"Diablo VT",         era:"1990s",    flag:"🇮🇹", years:"1993–98", country:"Italy",  produced:"575",   surviving:"~500",  value:"£180K–£400K",  rarity:"epic",      hagerty:"lamborghini/diablo/1994/1994-lamborghini-diablo_vt",
    desc:"Viscous Traction — the AWD Diablo. More manageable than the rear-drive, no less spectacular. Roadster version is the most exotic." },

  { name:"Bugatti Veyron",              make:"Bugatti",      model:"Veyron",            era:"1990s",    flag:"🇫🇷", years:"2005–11", country:"France", produced:"450",   surviving:"~420",  value:"£800K–£1.5M",  rarity:"epic",      hagerty:"bugatti/veyron/2006/2006-bugatti-veyron",
    desc:"The first production car to exceed 400km/h. W16 engine, 1001bhp, engineering tour de force. Built at enormous loss to demonstrate Volkswagen's capability." },

  { name:"Bentley Continental GT",      make:"Bentley",      model:"Continental GT",    era:"1990s",    flag:"🇬🇧", years:"2003–11", country:"UK",     produced:"~30,000",surviving:"~20,000",value:"£25K–£60K",   rarity:"common",    hagerty:"bentley/continental_gt/2004/2004-bentley-continental_gt",
    desc:"The car that saved Bentley after the VW acquisition. 6.0-litre twin-turbo W12, AWD, 200mph. Genuinely grand and genuinely fast." },

  { name:"Rolls-Royce Silver Seraph",   make:"Rolls-Royce",  model:"Silver Seraph",     era:"1990s",    flag:"🇬🇧", years:"1998–2002",country:"UK",    produced:"~1,700",surviving:"~1,400",value:"£30K–£80K",    rarity:"rare",      hagerty:"rolls~royce/silver_seraph/1999/1999-rolls~royce-silver_seraph",
    desc:"The last Rolls-Royce built under Vickers/BMW. A BMW 5.4-litre V12 in the final traditional body. The end of an era." },

  { name:"Rolls-Royce Ghost",           make:"Rolls-Royce",  model:"Ghost",             era:"1990s",    flag:"🇬🇧", years:"2009–14", country:"UK",     produced:"~13,000",surviving:"~11,000",value:"£60K–£130K",  rarity:"rare",      hagerty:"rolls~royce/ghost/2010/2010-rolls~royce-ghost",
    desc:"The first BMW-platform Rolls-Royce. Twin-turbo V12, air suspension, silent at 100mph. More driver-focused than the Phantom." },

  { name:"BMW M5 E60",                  make:"BMW",          model:"M5 E60",            era:"1990s",    flag:"🇩🇪", years:"2004–10", country:"Germany",produced:"~20,000",surviving:"~12,000",value:"£20K–£55K",   rarity:"rare",      hagerty:"bmw/m5/2006/2006-bmw-m5",
    desc:"The S85 V10 at 8,250rpm. The most extraordinary BMW engine ever fitted to a road car. 507bhp, 0-100 in 4.7 seconds, soundtrack like a Formula 1 car." },

  { name:"BMW M3 E30 Sport Evolution",  make:"BMW",          model:"M3 Sport Evolution",era:"1990s",    flag:"🇩🇪", years:"1990",    country:"Germany",produced:"600",   surviving:"~500",  value:"£250K–£600K",  rarity:"epic",      hagerty:"bmw/m3/1990/1990-bmw-m3-sport_evolution",
    desc:"The final E30 M3. 2.5-litre, 238bhp, adjustable front spoiler and rear wing. The most powerful and desirable M3 Sport Evolution variant." },

  { name:"Honda S2000",                 make:"Honda",        model:"S2000",             era:"1990s",    flag:"🇯🇵", years:"1999–2009",country:"Japan",  produced:"~66,000",surviving:"~40,000",value:"£15K–£40K",   rarity:"rare",      hagerty:"honda/s2000/2001/2001-honda-s2000",
    desc:"9,000rpm from 2.0 litres. The highest specific output naturally-aspirated engine in mass production. The last great Honda driver's car." },

  { name:"Mazda MX-5 Mk2 NB",          make:"Mazda",        model:"MX-5 NB",           era:"1990s",    flag:"🇯🇵", years:"1998–05", country:"Japan",  produced:"~176,000",surviving:"~80,000",value:"£5K–£18K",   rarity:"common",    hagerty:"mazda/mx~5_miata/2001/2001-mazda-mx~5_miata",
    desc:"The second-generation MX-5. Stiffer, slightly larger, but the same pure driving experience. The Sport with limited-slip diff is the driver's pick." },

  { name:"Toyota GT-Four ST205",        make:"Toyota",       model:"Celica GT-Four",    era:"1990s",    flag:"🇯🇵", years:"1994–99", country:"Japan",  produced:"~5,000",surviving:"~2,500",value:"£25K–£65K",    rarity:"rare",      hagerty:"toyota/celica/1994/1994-toyota-celica-gt~four",
    desc:"The WRC-homologation Celica. 255bhp turbocharged 2.0-litre, AWD. Carlos Sainz won the 1995 WRC title in one." },

  { name:"Nissan 300ZX Z32",            make:"Nissan",       model:"300ZX Z32",         era:"1990s",    flag:"🇯🇵", years:"1989–2000",country:"Japan",  produced:"~170,000",surviving:"~50,000",value:"£15K–£40K",  rarity:"rare",      hagerty:"nissan/300zx/1991/1991-nissan-300zx",
    desc:"The twin-turbo Z32 with 300bhp, four-wheel steering, and a Nissan sports car chassis at its best. Road & Track's 'best handling car in the world' in 1990." },

  { name:"Mitsubishi GTO Twin Turbo",   make:"Mitsubishi",   model:"GTO Twin Turbo",    era:"1990s",    flag:"🇯🇵", years:"1990–00", country:"Japan",  produced:"~82,000",surviving:"~15,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"mitsubishi/3000gt/1992/1992-mitsubishi-3000gt",
    desc:"320bhp AWD turbocharged GT. Four-wheel steering, active aerodynamics, electronic torque split. Hugely capable and thoroughly unfashionable — for now." },

  { name:"Renault Megane RS Phase 1",   make:"Renault",      model:"Mégane RS",         era:"1990s",    flag:"🇫🇷", years:"2004–09", country:"France", produced:"~60,000",surviving:"~25,000",value:"£8K–£22K",    rarity:"rare",      hagerty:"renault/megane/2004/2004-renault-megane_rs",
    desc:"The front-wheel drive Nürburgring lap record holder. 225bhp, limited-slip diff, extraordinary steering. Defined a generation of hot hatch." },

  { name:"Peugeot 306 GTI-6",           make:"Peugeot",      model:"306 GTI-6",         era:"1990s",    flag:"🇫🇷", years:"1996–02", country:"France", produced:"~25,000",surviving:"~3,000",value:"£10K–£28K",    rarity:"rare",      hagerty:"peugeot/306/1997/1997-peugeot-306-gti~6",
    desc:"167bhp six-speed hot hatch with chassis tuned by Sochaux and Lotus. Considered by many to be the finest front-wheel drive hot hatch ever made." },

  { name:"SEAT Cupra R Ibiza Mk3",      make:"SEAT",         model:"Ibiza Cupra R",     era:"1990s",    flag:"🇪🇸", years:"2002–03", country:"Spain",  produced:"~2,200",surviving:"~800",  value:"£12K–£30K",    rarity:"rare",      hagerty:"",
    desc:"210bhp from the 1.8T engine, limited-slip diff, stripped interior. Built for the Super 1600 rally series. An underrated Spanish hot hatch icon." },

  { name:"Alfa Romeo 156 GTA",          make:"Alfa Romeo",   model:"156 GTA",           era:"1990s",    flag:"🇮🇹", years:"2002–05", country:"Italy",  produced:"~5,500",surviving:"~2,500",value:"£12K–£35K",    rarity:"rare",      hagerty:"alfa_romeo/156/2003/2003-alfa_romeo-156-gta",
    desc:"The 3.2-litre Busso V6 in a saloon. Six-speed manual, limited-slip diff. One of the last truly passionate Italian fast saloons." },

  { name:"Vauxhall VX220",              make:"Vauxhall",     model:"VX220",             era:"1990s",    flag:"🇬🇧", years:"2001–05", country:"UK",     produced:"~7,400",surviving:"~4,000",value:"£10K–£28K",    rarity:"rare",      hagerty:"vauxhall/vx220/2002/2002-vauxhall-vx220",
    desc:"A Lotus Elise with a 2.0-litre Ecotec engine — built alongside it at Hethel. The turbo version is devastatingly fast. Seriously undervalued." },

  { name:"Lotus Elise S2",              make:"Lotus",        model:"Elise S2",          era:"1990s",    flag:"🇬🇧", years:"2001–11", country:"UK",     produced:"~9,000",surviving:"~7,000",value:"£18K–£40K",    rarity:"rare",      hagerty:"lotus/elise/2002/2002-lotus-elise",
    desc:"The revised Elise with Toyota Rover K-series then Toyota engines. More refined but still brilliantly connected. The Sport 135 is particularly fine." },

  { name:"Noble M400",                  make:"Noble",        model:"M400",              era:"1990s",    flag:"🇬🇧", years:"2004–06", country:"UK",     produced:"~150",  surviving:"~130",  value:"£40K–£90K",    rarity:"rare",      hagerty:"noble/m400/2005/2005-noble-m400",
    desc:"425bhp twin-turbo Ford V6, 1,160kg, no electronic aids. 0-60 in 3.5 seconds. The most focused driver's car you've probably never heard of." },

  { name:"Dodge Viper SRT-10",          make:"Dodge",        model:"Viper SRT-10",      era:"1990s",    flag:"🇺🇸", years:"2003–10", country:"USA",    produced:"~26,000",surviving:"~20,000",value:"£35K–£80K",   rarity:"rare",      hagerty:"dodge/viper/2004/2004-dodge-viper-srt~10",
    desc:"The third-gen Viper with 500bhp from the 8.3-litre V10. ACR track package is the definitive version. Still the most visceral American sports car." },

  { name:"Chrysler Prowler",            make:"Chrysler",     model:"Prowler",           era:"1990s",    flag:"🇺🇸", years:"1997–02", country:"USA",    produced:"~11,700",surviving:"~9,000",value:"£20K–£50K",   rarity:"rare",      hagerty:"chrysler/prowler/1997/1997-chrysler-prowler",
    desc:"A production hot rod. Aluminium body, independent rear suspension, V6 engine. More show than go, but a remarkable piece of design thinking." },

  { name:"Chevrolet Camaro SS 4th Gen", make:"Chevrolet",    model:"Camaro SS",         era:"1990s",    flag:"🇺🇸", years:"1993–02", country:"USA",    produced:"~60,000",surviving:"~25,000",value:"£15K–£40K",   rarity:"rare",      hagerty:"chevrolet/camaro/1998/1998-chevrolet-camaro-ss",
    desc:"The LS1 V8 Camaro. 320bhp, rear-wheel drive, muscular American presence. The SS package gives the look and the performance to match." },

  { name:"Ford Mustang SVT Cobra R",    make:"Ford",         model:"Mustang SVT Cobra R",era:"1990s",   flag:"🇺🇸", years:"2000",    country:"USA",    produced:"300",   surviving:"~270",  value:"£60K–£140K",   rarity:"epic",      hagerty:"ford/mustang/2000/2000-ford-mustang-svt_cobra_r",
    desc:"Only 300 built, sold only to licensed racers. 385bhp 5.4-litre V8, no air conditioning, no radio, no back seat. An utterly serious track weapon." },

  { name:"Jaguar XJR 100",              make:"Jaguar",       model:"XJR 100",           era:"1990s",    flag:"🇬🇧", years:"2002–03", country:"UK",     produced:"~500",  surviving:"~400",  value:"£15K–£40K",    rarity:"rare",      hagerty:"jaguar/xjr/2002/2002-jaguar-xjr",
    desc:"The centenary edition XJR with uprated 400bhp V8. Special interior, 20-inch alloys. Marks the end of the classic XJ era with appropriate distinction." },

  { name:"Aston Martin Vanquish",       make:"Aston Martin", model:"Vanquish",          era:"1990s",    flag:"🇬🇧", years:"2001–05", country:"UK",     produced:"1,503", surviving:"~1,300",value:"£60K–£120K",   rarity:"rare",      hagerty:"aston_martin/vanquish/2002/2002-aston_martin-vanquish",
    desc:"The 6.0-litre V12 Aston designed by Ian Callum. Hand-made at Newport Pagnell. 460bhp, electronic paddle-shift. Bond's car in Die Another Day." },

  { name:"Aston Martin V12 Vanquish S", make:"Aston Martin", model:"Vanquish S",        era:"1990s",    flag:"🇬🇧", years:"2004–07", country:"UK",     produced:"~1,000",surviving:"~900",  value:"£70K–£140K",   rarity:"rare",      hagerty:"aston_martin/vanquish/2005/2005-aston_martin-vanquish_s",
    desc:"520bhp, improved gearchange, uprated suspension. The definitive Vanquish — the final Newport Pagnell car and one of the greatest Astons." },

  { name:"Maserati Spyder Cambiocorsa", make:"Maserati",     model:"Spyder Cambiocorsa",era:"1990s",    flag:"🇮🇹", years:"2001–07", country:"Italy",  produced:"~3,000",surviving:"~2,000",value:"£20K–£55K",    rarity:"rare",      hagerty:"maserati/spyder/2002/2002-maserati-spyder",
    desc:"Ferrari-derived 4.2-litre V8 in a Pininfarina spider body. The paddle-shift Cambiocorsa gearbox and open roof make this a proper Italian event." },

  { name:"TVR Tuscan Speed Six",        make:"TVR",          model:"Tuscan Speed Six",  era:"1990s",    flag:"🇬🇧", years:"1999–2006",country:"UK",    produced:"~2,000",surviving:"~1,200",value:"£20K–£50K",    rarity:"rare",      hagerty:"tvr/tuscan/2001/2001-tvr-tuscan",
    desc:"TVR's own Speed Six engine — 360bhp, naturally aspirated, howling. No ABS, no traction control, no power steering, no stability control." },

  { name:"TVR T350C",                   make:"TVR",          model:"T350C",             era:"1990s",    flag:"🇬🇧", years:"2002–06", country:"UK",     produced:"~500",  surviving:"~350",  value:"£20K–£45K",    rarity:"rare",      hagerty:"tvr/t350/2003/2003-tvr-t350",
    desc:"The TVR Speed Six in a lighter, more focused body. Without driver aids, but more balanced than the Tuscan. The last great TVR designs." },

  { name:"Mosler MT900",                make:"Mosler",       model:"MT900",             era:"1990s",    flag:"🇺🇸", years:"2000–12", country:"USA",    produced:"~50",   surviving:"~45",   value:"£60K–£140K",   rarity:"rare",      hagerty:"",
    desc:"An American supercar with a Corvette LS engine in a carbon-fibre body. Extraordinarily light and fast. A proper driver's car from a tiny manufacturer." },


// ─── Final 71 to reach 500 ───────────────────────────────────────────────────

  // Pre-War
  { name:"Stutz Bearcat",               make:"Stutz",        model:"Bearcat",           era:"Pre-War",  flag:"🇺🇸", years:"1912–34", country:"USA",    produced:"~400",  surviving:"~100",  value:"£150K–£500K",  rarity:"epic",      hagerty:"stutz/bearcat/1914/1914-stutz-bearcat",
    desc:"America's sporting car of the 1910s. Harry Stutz built it in five weeks for the first Indianapolis 500. The car that defined American sporting glamour." },

  { name:"Packard Twelve",              make:"Packard",      model:"Twelve",            era:"Pre-War",  flag:"🇺🇸", years:"1932–39", country:"USA",    produced:"~5,700",surviving:"~1,500",value:"£80K–£250K",   rarity:"epic",      hagerty:"packard/twelve/1934/1934-packard-twelve",
    desc:"Packard's V12-powered flagship. Rivalled Rolls-Royce for quality and prestige. 'Ask the man who owns one.' Custom coachwork by Dietrich and LeBaron." },

  { name:"Sunbeam 3 Litre",             make:"Sunbeam",      model:"3 Litre",           era:"Pre-War",  flag:"🇬🇧", years:"1925–30", country:"UK",     produced:"~200",  surviving:"~100",  value:"£100K–£280K",  rarity:"epic",      hagerty:"",
    desc:"Britain's first supercharged production car. Henry Segrave used a racing version to win the first French Grand Prix for a British car." },

  // 1950s
  { name:"Pegaso Z-102",                make:"Pegaso",       model:"Z-102",             era:"1950s",    flag:"🇪🇸", years:"1951–58", country:"Spain",  produced:"~84",   surviving:"~55",   value:"£1M–£3M",      rarity:"legendary", hagerty:"",
    desc:"Spain's only supercar. Built by the state truck manufacturer ENASA. V8 engine, supercharged option, extraordinary bodywork by Touring and Saoutchik." },

  { name:"DB Panhard",                  make:"DB",           model:"Panhard",           era:"1950s",    flag:"🇫🇷", years:"1952–61", country:"France", produced:"~1,300",surviving:"~500",  value:"£20K–£60K",    rarity:"rare",      hagerty:"",
    desc:"Charles Deutsch and René Bonnet's lightweight sports car using Panhard components. Won its class at Le Mans repeatedly. A miniature marvel." },

  { name:"Turner Sports",               make:"Turner",       model:"Sports",            era:"1950s",    flag:"🇬🇧", years:"1950–66", country:"UK",     produced:"~650",  surviving:"~400",  value:"£15K–£40K",    rarity:"rare",      hagerty:"",
    desc:"Jack Turner's Worcestershire-built lightweight. Used various Ford and Climax engines. A staple of British club racing, often overlooked now." },

  { name:"Bristol 404",                 make:"Bristol",      model:"404",               era:"1950s",    flag:"🇬🇧", years:"1953–55", country:"UK",     produced:"52",    surviving:"~40",   value:"£60K–£160K",   rarity:"epic",      hagerty:"bristol/404/1954/1954-bristol-404",
    desc:"Bristol's most elegant pre-war-derived design. BMW 328-descended engine, aeronautical construction quality. Rare and exquisite." },

  // 1960s
  { name:"Lotus Elan +2",               make:"Lotus",        model:"Elan +2",           era:"1960s",    flag:"🇬🇧", years:"1967–74", country:"UK",     produced:"~5,200",surviving:"~3,000",value:"£15K–£40K",    rarity:"rare",      hagerty:"lotus/elan_%2b2/1969/1969-lotus-elan_%2b2",
    desc:"Colin Chapman's answer to family motoring. The twin-cam Elan with two small rear seats. The +2S 130 is the definitive version." },

  { name:"Lamborghini Jarama",          make:"Lamborghini",  model:"Jarama",            era:"1960s",    flag:"🇮🇹", years:"1970–76", country:"Italy",  produced:"328",   surviving:"~250",  value:"£150K–£380K",  rarity:"epic",      hagerty:"lamborghini/jarama/1971/1971-lamborghini-jarama",
    desc:"The successor to the Islero. Bertone designed a 2+2 GT on a shorter wheelbase. The S version with 365bhp is fastest and rarest." },

  { name:"Alfa Romeo Junior Zagato",    make:"Alfa Romeo",   model:"Junior Zagato",     era:"1960s",    flag:"🇮🇹", years:"1969–75", country:"Italy",  produced:"~1,500",surviving:"~1,000",value:"£40K–£110K",   rarity:"rare",      hagerty:"alfa_romeo/giulia/1970/1970-alfa_romeo-giulia-junior_zagato",
    desc:"Zagato's interpretation of the Giulia GT. Perspex-covered headlights, aerodynamic fastback body. Wonderfully idiosyncratic." },

  { name:"Dodge Challenger R/T",        make:"Dodge",        model:"Challenger R/T",    era:"1960s",    flag:"🇺🇸", years:"1970–71", country:"USA",    produced:"~76,000",surviving:"~15,000",value:"£40K–£120K",  rarity:"rare",      hagerty:"dodge/challenger/1970/1970-dodge-challenger-r!t",
    desc:"The E-Body Dodge muscle car. Six engine options from 340 to 426 Hemi. The Hemi car is among the most valuable American muscle cars." },

  { name:"Ford Boss 302 Mustang",       make:"Ford",         model:"Mustang Boss 302",  era:"1960s",    flag:"🇺🇸", years:"1969–70", country:"USA",    produced:"~11,000",surviving:"~5,000",value:"£60K–£160K",   rarity:"rare",      hagerty:"ford/mustang/1969/1969-ford-mustang-boss_302",
    desc:"Built for Trans-Am homologation. High-revving 302ci V8, revised suspension. Parnelli Jones won the 1970 Trans-Am in one." },

  { name:"Alfa Romeo 33/3",             make:"Alfa Romeo",   model:"Tipo 33/3",         era:"1960s",    flag:"🇮🇹", years:"1969–71", country:"Italy",  produced:"~10",   surviving:"~8",    value:"£3M–£8M",      rarity:"legendary", hagerty:"",
    desc:"The Alfa Romeo sports-prototype racer. Won the Targa Florio in 1971 and 1972. A mid-engined 3-litre V8 of extraordinary beauty and rarity." },

  { name:"Marcos GT",                   make:"Marcos",       model:"GT",                era:"1960s",    flag:"🇬🇧", years:"1964–71", country:"UK",     produced:"~1,000",surviving:"~700",  value:"£20K–£55K",    rarity:"rare",      hagerty:"",
    desc:"The marine ply-chassised British GT. Ford V6 in Volvo-powered later versions. A wedge-shaped sports car of charm and real performance." },

  { name:"TVR Grantura",                make:"TVR",          model:"Grantura",          era:"1960s",    flag:"🇬🇧", years:"1958–67", country:"UK",     produced:"~800",  surviving:"~500",  value:"£20K–£60K",    rarity:"rare",      hagerty:"tvr/grantura/1963/1963-tvr-grantura",
    desc:"The original TVR. Round fibreglass body, various Ford and MGA engines. The Mk3 with the MGB engine is the definitive version." },

  { name:"Sunbeam Tiger",               make:"Sunbeam",      model:"Tiger",             era:"1960s",    flag:"🇬🇧", years:"1964–67", country:"UK",     produced:"7,085", surviving:"~3,000",value:"£30K–£75K",    rarity:"rare",      hagerty:"sunbeam/tiger/1965/1965-sunbeam-tiger",
    desc:"Carroll Shelby's formula applied to the Sunbeam Alpine — stuff a Ford V8 in it. 164bhp in a compact British roadster. Le Mans class winner." },

  // 70s–80s
  { name:"Porsche 911 Turbo 3.0 (930)", make:"Porsche",      model:"911 Turbo 3.0",     era:"70s–80s",  flag:"🇩🇪", years:"1975–77", country:"Germany",produced:"2,873", surviving:"~2,000",value:"£200K–£500K",  rarity:"epic",      hagerty:"porsche/930/1976/1976-porsche-930",
    desc:"The first turbo 911. Three litres, 260bhp, no intercooler. The most concentrated turbo lag experience of any road car. A landmark." },

  { name:"Porsche 964 RS",              make:"Porsche",      model:"964 RS",            era:"70s–80s",  flag:"🇩🇪", years:"1991–92", country:"Germany",produced:"~2,000",surviving:"~1,700",value:"£200K–£450K",  rarity:"epic",      hagerty:"porsche/964/1992/1992-porsche-964-rs",
    desc:"The lightweight 964 with Carrera Cup suspension, stripped interior, 260bhp. A bridge between the RS 2.7 and the 993 RS in terms of driver appeal." },

  { name:"Ferrari 288 GTO",             make:"Ferrari",      model:"288 GTO",           era:"70s–80s",  flag:"🇮🇹", years:"1984–85", country:"Italy",  produced:"272",   surviving:"~265",  value:"£3M–£6M",      rarity:"legendary", hagerty:"ferrari/288_gto/1985/1985-ferrari-288_gto",
    desc:"The Group B homologation car Ferrari never raced. Twin-turbo V8 producing 400bhp. The car that directly inspired the F40. Extraordinarily desirable." },

  { name:"Ferrari F355 GTS",            make:"Ferrari",      model:"F355 GTS",          era:"70s–80s",  flag:"🇮🇹", years:"1995–99", country:"Italy",  produced:"3,717", surviving:"~3,200",value:"£75K–£150K",   rarity:"rare",      hagerty:"ferrari/355/1997/1997-ferrari-355-gts",
    desc:"The targa-top F355. Same five-valve-per-cylinder screamer but with a removable roof panel. Open-air V8 motoring at its most accessible." },

  { name:"Ferrari 412",                 make:"Ferrari",      model:"412",               era:"70s–80s",  flag:"🇮🇹", years:"1985–89", country:"Italy",  produced:"576",   surviving:"~500",  value:"£60K–£130K",   rarity:"rare",      hagerty:"ferrari/412/1986/1986-ferrari-412",
    desc:"The final evolution of the 365 GT4 2+2 line. 340bhp V12, automatic or manual. The definitive classic Ferrari grand tourer." },

  { name:"Jaguar XJR-9",                make:"Jaguar",       model:"XJR-9",             era:"70s–80s",  flag:"🇬🇧", years:"1988–90", country:"UK",     produced:"~16",   surviving:"~14",   value:"£5M–£10M",     rarity:"legendary", hagerty:"",
    desc:"Won Le Mans outright in 1988 with Jan Lammers, Johnny Dumfries and Andy Wallace. Tom Walkinshaw's masterpiece. A national hero." },

  { name:"Mercedes-Benz 300SL W198 Roadster clone",make:"Mercedes-Benz",model:"300E",   era:"70s–80s",  flag:"🇩🇪", years:"1984–93", country:"Germany",produced:"~73,000",surviving:"~25,000",value:"£10K–£30K",   rarity:"common",    hagerty:"mercedes~benz/300e/1987/1987-mercedes~benz-300e",
    desc:"The W124 300E — the car that defined the ideal executive saloon for a decade. 3.0-litre straight-six, impeccable build quality. Timeless." },

  { name:"Porsche 914/4",               make:"Porsche",      model:"914/4",             era:"70s–80s",  flag:"🇩🇪", years:"1969–76", country:"Germany",produced:"115,596",surviving:"~30,000",value:"£15K–£40K",   rarity:"rare",      hagerty:"porsche/914/1972/1972-porsche-914",
    desc:"The entry-level Porsche/VW collaboration. Mid-engine, targa top, pure handling. Often dismissed but now properly appreciated." },

  { name:"Lancia Beta Coupé",           make:"Lancia",       model:"Beta Coupé",        era:"70s–80s",  flag:"🇮🇹", years:"1973–84", country:"Italy",  produced:"~115,000",surviving:"~5,000",value:"£8K–£25K",    rarity:"rare",      hagerty:"lancia/beta/1977/1977-lancia-beta-coupe",
    desc:"Pininfarina's elegant Lancia coupé. The HPE estate version is particularly unusual. Twin-cam engines in a light, well-balanced car." },

  { name:"Alfa Romeo Spider (Kamm tail)",make:"Alfa Romeo",  model:"Spider Kamm",       era:"70s–80s",  flag:"🇮🇹", years:"1970–82", country:"Italy",  produced:"~17,000",surviving:"~7,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"alfa_romeo/spider/1975/1975-alfa_romeo-spider",
    desc:"The Series 2 Spider with the Kamm tail — a more practical boot. Twin-cam, rear-wheel drive, Italian roadster charm. Ideal everyday classic." },

  { name:"Fiat X1/9",                   make:"Fiat",         model:"X1/9",              era:"70s–80s",  flag:"🇮🇹", years:"1972–89", country:"Italy",  produced:"~170,000",surviving:"~30,000",value:"£5K–£18K",   rarity:"rare",      hagerty:"fiat/x1!9/1975/1975-fiat-x1!9",
    desc:"Bertone's affordable mid-engined targa. The only mass-produced mid-engined car under £5,000 in its era. A wedge-shaped Italian delight." },

  { name:"Matra Murena",                make:"Matra",        model:"Murena",            era:"70s–80s",  flag:"🇫🇷", years:"1980–83", country:"France", produced:"~10,600",surviving:"~3,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"matra/murena/1982/1982-matra-murena",
    desc:"Three-abreast seating, mid-engine, plastic body — utterly French. The 2.2-litre version is quick and the handling rewards commitment." },

  { name:"Pantera GT5",                 make:"De Tomaso",    model:"Pantera GT5",       era:"70s–80s",  flag:"🇮🇹", years:"1980–85", country:"Italy",  produced:"~270",  surviving:"~220",  value:"£80K–£200K",   rarity:"rare",      hagerty:"de_tomaso/pantera/1980/1980-de_tomaso-pantera_gt5",
    desc:"The widened arches, massive spoiler GT5. Ford Cleveland V8 still beneath the skin. Outrageous looks that still stop traffic." },

  { name:"Morgan Plus 8",               make:"Morgan",       model:"Plus 8",            era:"70s–80s",  flag:"🇬🇧", years:"1968–2004",country:"UK",    produced:"~6,000",surviving:"~5,000",value:"£30K–£80K",    rarity:"rare",      hagerty:"morgan/plus_8/1975/1975-morgan-plus_8",
    desc:"Rover V8 in the traditional Morgan body. Terrifyingly fast in a car with virtually no safety aids. The most extreme traditional British sports car." },

  { name:"Ginetta G32",                 make:"Ginetta",      model:"G32",               era:"70s–80s",  flag:"🇬🇧", years:"1989–92", country:"UK",     produced:"~100",  surviving:"~70",   value:"£12K–£30K",    rarity:"rare",      hagerty:"",
    desc:"Ginetta's rare convertible using Ford Sierra mechanicals. A proper British sports car from the Walklett brothers' last era." },

  // 1990s
  { name:"Ferrari 360 Spider",          make:"Ferrari",      model:"360 Spider",        era:"1990s",    flag:"🇮🇹", years:"2000–05", country:"Italy",  produced:"~7,565",surviving:"~6,500",value:"£55K–£110K",   rarity:"rare",      hagerty:"ferrari/360_modena/2001/2001-ferrari-360_spider",
    desc:"The open-top 360. Electric folding roof, same 400bhp V8. The most entertaining way to hear a Ferrari V8." },

  { name:"Ferrari 612 Scaglietti",      make:"Ferrari",      model:"612 Scaglietti",    era:"1990s",    flag:"🇮🇹", years:"2004–11", country:"Italy",  produced:"~3,000",surviving:"~2,700",value:"£60K–£120K",   rarity:"rare",      hagerty:"ferrari/612_scaglietti/2005/2005-ferrari-612_scaglietti",
    desc:"The front-engined V12 2+2. Named for master coachbuilder Sergio Scaglietti. A proper grand tourer with a 540bhp singing V12." },

  { name:"Lamborghini Murciélago LP640",make:"Lamborghini",  model:"Murciélago LP640",  era:"1990s",    flag:"🇮🇹", years:"2006–10", country:"Italy",  produced:"~1,600",surviving:"~1,400",value:"£150K–£350K",  rarity:"epic",      hagerty:"lamborghini/murcielago/2006/2006-lamborghini-murcielago_lp640",
    desc:"The 640bhp final version of the Murciélago. Revised aerodynamics, enhanced exhaust, scissor doors as dramatic as ever." },

  { name:"Aston Martin DB9",            make:"Aston Martin", model:"DB9",               era:"1990s",    flag:"🇬🇧", years:"2004–16", country:"UK",     produced:"~17,000",surviving:"~14,000",value:"£35K–£80K",   rarity:"rare",      hagerty:"aston_martin/db9/2005/2005-aston_martin-db9",
    desc:"The aluminium VH platform Aston. 450bhp hand-built V12, Gaydon-built. The DB9 Volante is the most desirable open Aston since the DB6." },

  { name:"Bentley Arnage T",            make:"Bentley",      model:"Arnage T",          era:"1990s",    flag:"🇬🇧", years:"2002–09", country:"UK",     produced:"~4,500",surviving:"~4,000",value:"£40K–£100K",   rarity:"rare",      hagerty:"bentley/arnage/2003/2003-bentley-arnage_t",
    desc:"450bhp twin-turbo V8 in the ultimate British luxury saloon. Hand-stitched leather, burr walnut, 0-60 in 5.0 seconds. Thunderously fast and magnificently appointed." },

  { name:"Maserati Coupe Cambiocorsa",  make:"Maserati",     model:"Coupé Cambiocorsa", era:"1990s",    flag:"🇮🇹", years:"2001–07", country:"Italy",  produced:"~4,000",surviving:"~2,500",value:"£18K–£45K",    rarity:"rare",      hagerty:"maserati/coupe/2003/2003-maserati-coupe",
    desc:"Ferrari-derived V8 in a Pininfarina coupé. The paddle-shift Cambiocorsa gearbox makes every gear change an event." },

  { name:"BMW Z4 M Roadster",           make:"BMW",          model:"Z4 M Roadster",     era:"1990s",    flag:"🇩🇪", years:"2006–08", country:"Germany",produced:"~6,600",surviving:"~5,000",value:"£22K–£55K",    rarity:"rare",      hagerty:"bmw/z4/2007/2007-bmw-z4-m_roadster",
    desc:"The S54 engine from the M3 in a roadster body. A throwback to pure analogue driving in an era of electronic aids. Deeply underrated." },

  { name:"Alfa Romeo 8C Competizione", make:"Alfa Romeo",   model:"8C Competizione",   era:"1990s",    flag:"🇮🇹", years:"2007–10", country:"Italy",  produced:"500",   surviving:"~480",  value:"£200K–£450K",  rarity:"epic",      hagerty:"alfa_romeo/8c/2008/2008-alfa_romeo-8c_competizione",
    desc:"Alfa Romeo's return to the supercar arena. Ferrari-derived V8, carbon fibre body styled by Giugiaro. Only 500 coupés and 500 Spiders built." },

  { name:"Renault Megane R26.R",        make:"Renault",      model:"Mégane R26.R",      era:"1990s",    flag:"🇫🇷", years:"2008–09", country:"France", produced:"450",   surviving:"~380",  value:"£40K–£90K",    rarity:"rare",      hagerty:"renault/megane/2008/2008-renault-megane_r26.r",
    desc:"230bhp, 1,260kg. Set the Nürburgring FWD record. Stripped of rear seats, sound deadening, and half the bodywork. A stripped French racer for the road." },

  { name:"Subaru Impreza STi Spec C",   make:"Subaru",       model:"Impreza STi Spec C",era:"1990s",    flag:"🇯🇵", years:"2005–07", country:"Japan",  produced:"~2,000",surviving:"~1,200",value:"£20K–£50K",    rarity:"rare",      hagerty:"subaru/impreza/2006/2006-subaru-impreza-wrx_sti",
    desc:"The lightweight Japan-only Impreza. Carbon roof, bucket seats, 300bhp but with reduced weight. The focused driver's STi." },

  { name:"Mitsubishi Lancer Evo IX MR", make:"Mitsubishi",   model:"Evo IX MR",         era:"1990s",    flag:"🇯🇵", years:"2005–07", country:"Japan",  produced:"~2,000",surviving:"~1,500",value:"£20K–£55K",    rarity:"rare",      hagerty:"mitsubishi/lancer_evolution/2006/2006-mitsubishi-lancer_evolution_ix",
    desc:"The naturally-aspirated rev-happy 4G63T in its final form. Twin-scroll turbo, Super AYC, the fastest Evo IX. 280bhp of legendary AWD performance." },

  { name:"Honda Civic Type R EP3",      make:"Honda",        model:"Civic Type R EP3",  era:"1990s",    flag:"🇬🇧", years:"2001–05", country:"UK",     produced:"~11,000",surviving:"~4,000",value:"£10K–£28K",   rarity:"rare",      hagerty:"honda/civic/2002/2002-honda-civic-type_r",
    desc:"The first Type R built at Swindon for Europe. K20 engine producing 197bhp at 8,000rpm. Recaro seats, limited-slip diff, legendary chassis." },

  { name:"MINI Cooper S R53",           make:"MINI",         model:"Cooper S R53",      era:"1990s",    flag:"🇬🇧", years:"2002–06", country:"UK",     produced:"~200,000",surviving:"~60,000",value:"£6K–£18K",   rarity:"common",    hagerty:"mini/cooper_s/2003/2003-mini-cooper_s",
    desc:"BMW's revival of the Mini. Eaton supercharger, go-kart handling, iconic styling. The JCW version with 210bhp is the enthusiast's pick." },

  { name:"Ford Focus RS Mk1",           make:"Ford",         model:"Focus RS Mk1",      era:"1990s",    flag:"🇬🇧", years:"2002–03", country:"UK",     produced:"~4,500",surviving:"~2,500",value:"£15K–£40K",    rarity:"rare",      hagerty:"ford/focus/2002/2002-ford-focus-rs",
    desc:"Only 4,501 built for homologation. 215bhp turbo, front-wheel drive, giant wing. Ford's rally heritage applied to the Focus. A cult classic." },

  { name:"Vauxhall Monaro VXR",         make:"Vauxhall",     model:"Monaro VXR",        era:"1990s",    flag:"🇬🇧", years:"2004–05", country:"UK",     produced:"~1,000",surviving:"~700",  value:"£12K–£35K",    rarity:"rare",      hagerty:"",
    desc:"300bhp LS1 V8 in a Holden Monaro body — sold as a Vauxhall in the UK. Rear-wheel drive muscle car. Brutally effective and increasingly appreciated." },

  { name:"Pontiac GTO 2004",            make:"Pontiac",      model:"GTO (2004)",        era:"1990s",    flag:"🇺🇸", years:"2004–06", country:"USA",    produced:"~40,000",surviving:"~25,000",value:"£12K–£35K",   rarity:"rare",      hagerty:"pontiac/gto/2005/2005-pontiac-gto",
    desc:"The Holden Monaro sold as a Pontiac GTO. LS2 V8, rear-wheel drive, no gimmicks. The 'wrong' GTO that was actually rather good." },

  { name:"Chrysler 300C SRT8",          make:"Chrysler",     model:"300C SRT8",         era:"1990s",    flag:"🇺🇸", years:"2005–10", country:"USA",    produced:"~15,000",surviving:"~9,000",value:"£10K–£28K",    rarity:"rare",      hagerty:"chrysler/300c/2006/2006-chrysler-300c-srt8",
    desc:"425bhp HEMI V8 in an imposing American saloon. The muscle car formula applied to a full-size luxury car. Enormously effective." },

  { name:"Koenigsegg CC8S",             make:"Koenigsegg",   model:"CC8S",              era:"1990s",    flag:"🇸🇪", years:"2002–04", country:"Sweden", produced:"6",     surviving:"6",     value:"£1.5M–£3M",    rarity:"legendary", hagerty:"",
    desc:"The first production Koenigsegg. 655bhp supercharged V8, carbon body, dihedral doors. Sweden's surprise contribution to the hypercar world." },

  { name:"Pagani Zonda S",              make:"Pagani",       model:"Zonda S",           era:"1990s",    flag:"🇮🇹", years:"2002–05", country:"Italy",  produced:"~25",   surviving:"~23",   value:"£2.5M–£6M",    rarity:"legendary", hagerty:"pagani/zonda/2002/2002-pagani-zonda_s",
    desc:"The more powerful Zonda with a 555bhp Mercedes AMG V12. Still handmade, still utterly unique. Horacio Pagani's masterwork continues." },

  { name:"Saleen S7 Twin Turbo",        make:"Saleen",       model:"S7 Twin Turbo",     era:"1990s",    flag:"🇺🇸", years:"2005–09", country:"USA",    produced:"~80",   surviving:"~75",   value:"£400K–£900K",  rarity:"epic",      hagerty:"",
    desc:"750bhp twin-turbocharged 7.0-litre V8 in an all-aluminium body. The fastest road car in the world for a brief period. American engineering at the extreme." },

  { name:"Spyker C8 Spyder",            make:"Spyker",       model:"C8 Spyder",         era:"1990s",    flag:"🇳🇱", years:"2000–14", country:"Netherlands",produced:"~200",surviving:"~180",value:"£80K–£200K",   rarity:"epic",      hagerty:"",
    desc:"The Dutch supercar revival. Audi V8, exposed machined components in the cockpit, stunning spider bodywork. A jewel of hand-craftsmanship." },

  { name:"Bristol Fighter",             make:"Bristol",      model:"Fighter",           era:"1990s",    flag:"🇬🇧", years:"2004–11", country:"UK",     produced:"~13",   surviving:"~12",   value:"£200K–£500K",  rarity:"legendary", hagerty:"",
    desc:"Dodge Viper V10 in a Bristol Fighter body. 525bhp, 210mph, built to order by Bristol's eccentric team. The most British of all supercars." },

  { name:"Ginetta G40 GT5",             make:"Ginetta",      model:"G40 GT5",           era:"1990s",    flag:"🇬🇧", years:"2009–",   country:"UK",     produced:"~500",  surviving:"~450",  value:"£15K–£35K",    rarity:"rare",      hagerty:"",
    desc:"The modern Ginetta GT5 race car. Ford Sigma 1.8-litre, rear-wheel drive, lightweight. The accessible racing Ginetta that made the brand modern." },

  { name:"Caterham CSR 260",            make:"Caterham",     model:"CSR 260",           era:"1990s",    flag:"🇬🇧", years:"2005–12", country:"UK",     produced:"~200",  surviving:"~180",  value:"£30K–£70K",    rarity:"rare",      hagerty:"",
    desc:"260bhp Ford Duratec in a Caterham with double-wishbone suspension. 0-60 in under 3.5 seconds in a car weighing 550kg. Pure adrenaline." },

  { name:"Ariel Atom 2",                make:"Ariel",        model:"Atom 2",            era:"1990s",    flag:"🇬🇧", years:"2001–10", country:"UK",     produced:"~1,500",surviving:"~1,300",value:"£15K–£35K",    rarity:"rare",      hagerty:"",
    desc:"The car without bodywork. A space-frame with a seat, engine and four wheels. Honda Civic Type R engine, 500bhp/tonne. The fastest road car money can buy." },

  { name:"Dodge Challenger SRT Hellcat",make:"Dodge",        model:"Challenger Hellcat",era:"1990s",    flag:"🇺🇸", years:"2015–23", country:"USA",    produced:"~40,000",surviving:"~35,000",value:"£40K–£80K",   rarity:"rare",      hagerty:"dodge/challenger/2015/2015-dodge-challenger-srt_hellcat",
    desc:"707bhp supercharged Hemi V8. The most powerful muscle car ever produced in series. Absurd, brilliant, unapologetically American." },

  // Top-up to reach 500
  { name:"Bentley Mulsanne Turbo R",    make:"Bentley",      model:"Mulsanne Turbo R",  era:"70s–80s",  flag:"🇬🇧", years:"1985–92", country:"UK",     produced:"~1,700",surviving:"~900",  value:"£30K–£80K",    rarity:"rare",      hagerty:"bentley/turbo_r/1989/1989-bentley-turbo_r",
    desc:"The Bentley that woke the marque from its Rolls-Royce slumber. 360bhp turbocharged V8, 0-60 in under 7 seconds, presidential presence." },

  { name:"Bentley Continental R",       make:"Bentley",      model:"Continental R",     era:"1990s",    flag:"🇬🇧", years:"1991–02", country:"UK",     produced:"~1,800",surviving:"~1,500",value:"£35K–£85K",    rarity:"rare",      hagerty:"bentley/continental_r/1994/1994-bentley-continental_r",
    desc:"Bentley's re-assertion as a sporting marque. A massive turbocharged coupé at Crewe quality. The T-Sport and Mulliner versions are particularly desirable." },

  { name:"Rolls-Royce Corniche",        make:"Rolls-Royce",  model:"Corniche",          era:"70s–80s",  flag:"🇬🇧", years:"1971–96", country:"UK",     produced:"~5,000",surviving:"~3,500",value:"£50K–£130K",   rarity:"rare",      hagerty:"rolls~royce/corniche/1975/1975-rolls~royce-corniche",
    desc:"The drophead Rolls-Royce that defined a certain glamour. 25 years in production. The Silver V8 engine, hydraulic hood, sheer extravagance." },

  { name:"Alfa Romeo 164 Q4",           make:"Alfa Romeo",   model:"164 Q4",            era:"70s–80s",  flag:"🇮🇹", years:"1992–98", country:"Italy",  produced:"~2,500",surviving:"~800",  value:"£8K–£25K",     rarity:"rare",      hagerty:"",
    desc:"The AWD Busso V6 in the Pininfarina 164 body. A proper super-saloon that competed with BMW and Mercedes. Devastatingly rare now." },

  { name:"Alfa Romeo 164 Cloverleaf",   make:"Alfa Romeo",   model:"164 Cloverleaf",    era:"70s–80s",  flag:"🇮🇹", years:"1990–98", country:"Italy",  produced:"~25,000",surviving:"~4,000",value:"£5K–£18K",     rarity:"rare",      hagerty:"alfa_romeo/164/1992/1992-alfa_romeo-164-cloverleaf",
    desc:"210bhp Busso V6 in one of Pininfarina's finest Italian saloons. The Alfa Romeo answer to every BMW M5. Still deeply rewarding to drive." },

  { name:"Lotus Elise Sport 135",       make:"Lotus",        model:"Elise Sport 135",   era:"1990s",    flag:"🇬🇧", years:"2004–11", country:"UK",     produced:"~500",  surviving:"~450",  value:"£20K–£42K",    rarity:"rare",      hagerty:"lotus/elise/2005/2005-lotus-elise_sport_135",
    desc:"The track-focused S2 Elise. Removable hardtop, uprated suspension, 135bhp. The best balance of road and circuit ability in the range." },

  { name:"Lancia Thema 8.32",           make:"Lancia",       model:"Thema 8.32",        era:"70s–80s",  flag:"🇮🇹", years:"1986–92", country:"Italy",  produced:"~2,500",surviving:"~500",  value:"£20K–£55K",    rarity:"rare",      hagerty:"lancia/thema/1988/1988-lancia-thema_8.32",
    desc:"A Ferrari 308 engine in a Lancia family saloon. 215bhp flat-plane V8 behind the front axle. One of the great sleeper cars. Utterly mad." },

  { name:"Audi Quattro Sport SWB",      make:"Audi",         model:"Quattro Sport SWB", era:"70s–80s",  flag:"🇩🇪", years:"1983–84", country:"Germany",produced:"214",   surviving:"~200",  value:"£300K–£700K",  rarity:"epic",      hagerty:"audi/quattro/1984/1984-audi-quattro_sport",
    desc:"The ultra-short-wheelbase Group B weapon. Essentially a rally car for the road. Values have risen significantly as collectors recognise its importance." },

  { name:"Talbot Horizon GL",           make:"Talbot",       model:"Horizon GL",        era:"70s–80s",  flag:"🇬🇧", years:"1977–86", country:"UK",     produced:"~1.5M", surviving:"~500",  value:"£3K–£10K",     rarity:"common",    hagerty:"",
    desc:"Car of the Year 1979. Practical front-wheel drive hatchback sold under multiple badges. A mundane but historically important period piece." },

  { name:"MG Maestro Turbo",            make:"MG",           model:"Maestro Turbo",     era:"70s–80s",  flag:"🇬🇧", years:"1989–91", country:"UK",     produced:"~505",  surviving:"~100",  value:"£12K–£35K",    rarity:"epic",      hagerty:"",
    desc:"Only 505 built. 150bhp turbocharged 2-litre, the fastest front-wheel drive BL car ever. Devastatingly rare and rapidly appreciating." },

  { name:"Jensen Healey",               make:"Jensen",       model:"Healey",            era:"70s–80s",  flag:"🇬🇧", years:"1972–76", country:"UK",     produced:"10,926",surviving:"~4,000",value:"£10K–£30K",    rarity:"rare",      hagerty:"jensen/healey/1974/1974-jensen-healey",
    desc:"Donald Healey's last car, built at Jensen. Lotus 907 engine, open roadster body. Suffered early build quality issues but now properly appreciated." },

  { name:"Ginetta G27",                 make:"Ginetta",      model:"G27",               era:"1990s",    flag:"🇬🇧", years:"1992–99", country:"UK",     produced:"~75",   surviving:"~60",   value:"£18K–£45K",    rarity:"rare",      hagerty:"",
    desc:"A pure two-seat British sports car using Ford Zetec or Rover K-series engines. Hand-built in small numbers. The essence of the club racing tradition." },

  { name:"Proton Satria GTi",           make:"Proton",       model:"Satria GTi",        era:"1990s",    flag:"🇲🇾", years:"1998–07", country:"Malaysia",produced:"~50,000",surviving:"~10,000",value:"£3K–£10K",   rarity:"common",    hagerty:"",
    desc:"The Malaysian Lotus-developed hot hatch. 103bhp 1.8 litre, Lotus-tuned chassis, 4-wheel disc brakes. Better to drive than its price suggests." },

  { name:"Honda Beat",                  make:"Honda",        model:"Beat",              era:"1990s",    flag:"🇯🇵", years:"1991–96", country:"Japan",  produced:"~33,600",surviving:"~15,000",value:"£6K–£20K",    rarity:"rare",      hagerty:"",
    desc:"Soichiro Honda's last car. Mid-engined, 656cc, red-line at 8,100rpm. Japan's tiniest roadster and perhaps its most characterful kei car." },

];

const WIKI_PAGES = {
  'Jaguar E-Type Series 1 Roadster': 'Jaguar_E-type',
  'Jaguar E-Type Series 1 Coupé':    'Jaguar_E-type',
  'Jaguar E-Type Series 2':          'Jaguar_E-type',
  'Jaguar E-Type Series 3 V12':      'Jaguar_E-type',
  'Jaguar E-Type Series 1 4.2':      'Jaguar_E-type',
  'Jaguar XK120 Roadster':           'Jaguar_XK120',
  'Jaguar XK120 Coupé':              'Jaguar_XK120',
  'Jaguar XK140':                    'Jaguar_XK140',
  'Jaguar XK150':                    'Jaguar_XK150',
  'Jaguar XJ220':                    'Jaguar_XJ220',
  'Jaguar C-Type':                   'Jaguar_C-Type',
  'Jaguar D-Type':                   'Jaguar_D-Type',
  'Jaguar Mk1':                      'Jaguar_Mark_1',
  'Jaguar Mk2 3.8':                  'Jaguar_Mark_2',
  'Jaguar XJ6 Series 2':             'Jaguar_XJ_(XJ6/12_Series_II)',
  'Jaguar XJ12':                     'Jaguar_XJ_(XJ6/12_Series_I)',
  'Jaguar XJ-S V12':                 'Jaguar_XJ-S',
  'Jaguar XJR-S':                    'Jaguar_XJR-S',
  'Jaguar XJR-9':                    'Jaguar_XJR-9',
  'Jaguar XJR V8':                   'Jaguar_XJ_(X300)',
  'Jaguar XJR 100':                  'Jaguar_XJR',
  'Jaguar XK8':                      'Jaguar_XK8',
  'Jaguar XKR':                      'Jaguar_XK8',
  'Jaguar XJ8':                      'Jaguar_XJ_(X300)',
  'Aston Martin Le Mans':            'Aston_Martin_1½_Litre',
  'Aston Martin Ulster':             'Aston_Martin_Ulster',
  'Aston Martin DB2/4':              'Aston_Martin_DB2/4',
  'Aston Martin DB Mark III':        'Aston_Martin_DB_Mark_III',
  'Aston Martin DB4':                'Aston_Martin_DB4',
  'Aston Martin DB4 GT Zagato':      'Aston_Martin_DB4_GT_Zagato',
  'Aston Martin DB5':                'Aston_Martin_DB5',
  'Aston Martin DB6':                'Aston_Martin_DB6',
  'Aston Martin DBS':                'Aston_Martin_DBS_(1967)',
  'Aston Martin DBS V8':             'Aston_Martin_DBS_(1967)',
  'Aston Martin V8 Vantage':         'Aston_Martin_V8',
  'Aston Martin V8 Saloon':          'Aston_Martin_V8',
  'Aston Martin Lagonda':            'Aston_Martin_Lagonda_(series_2)',
  'Aston Martin V8 Vantage Le Mans': 'Aston_Martin_V8_Vantage_(1977)',
  'Aston Martin Vantage V600':       'Aston_Martin_V8_Vantage_(1977)',
  'Aston Martin DB7':                'Aston_Martin_DB7',
  'Aston Martin DB7 Vantage':        'Aston_Martin_DB7',
  'Aston Martin DB7 Zagato':         'Aston_Martin_DB7_Zagato',
  'Aston Martin Vanquish':           'Aston_Martin_Vanquish',
  'Aston Martin V12 Vanquish S':     'Aston_Martin_Vanquish',
  'Aston Martin DB9':                'Aston_Martin_DB9',
  'Ferrari 250 GT Europa':           'Ferrari_250_GT',
  'Ferrari 250 GT Boano':            'Ferrari_250_GT',
  'Ferrari 250 GT TdF':              'Ferrari_250_GT_Tour_de_France',
  'Ferrari 250 GT Berlinetta SWB':   'Ferrari_250_GT_SWB',
  'Ferrari 250 GTO':                 'Ferrari_250_GTO',
  'Ferrari 250 GT Lusso':            'Ferrari_250_GT_Lusso',
  'Ferrari 250 GT Cabriolet':        'Ferrari_250_GT_Cabriolet',
  'Ferrari 250 MM':                  'Ferrari_250_MM',
  'Ferrari 166 MM':                  'Ferrari_166_MM',
  'Ferrari 212 Inter':               'Ferrari_212_Inter',
  'Ferrari 275 GTB':                 'Ferrari_275_GTB',
  'Ferrari 275 GTS':                 'Ferrari_275_GTB',
  'Ferrari 330 GTC':                 'Ferrari_330',
  'Ferrari 365 GTB/4 Daytona':       'Ferrari_365_GTB/4',
  'Ferrari 365 GTC/4':               'Ferrari_365_GTC/4',
  'Ferrari 500 Mondial':             'Ferrari_500_Mondial',
  'Ferrari 246 Dino GT':             'Ferrari_Dino_206_GT_and_246_GT',
  'Ferrari 246 Dino GTS':            'Ferrari_Dino_206_GT_and_246_GT',
  'Ferrari 308 GTB':                 'Ferrari_308_GTB/GTS',
  'Ferrari 308 GTS':                 'Ferrari_308_GTB/GTS',
  'Ferrari 308 GT4':                 'Ferrari_308_GT4',
  'Ferrari 308 GT4 Dino':            'Ferrari_308_GT4',
  'Ferrari 328 GTB':                 'Ferrari_328',
  'Ferrari 328 GTS':                 'Ferrari_328',
  'Ferrari 512 BB':                  'Ferrari_Berlinetta_Boxer',
  'Ferrari 400 GT':                  'Ferrari_400',
  'Ferrari 412':                     'Ferrari_412',
  'Ferrari Mondial':                 'Ferrari_Mondial',
  'Ferrari Testarossa':              'Ferrari_Testarossa',
  'Ferrari 288 GTO':                 'Ferrari_288_GTO',
  'Ferrari 348 tb':                  'Ferrari_348',
  'Ferrari 348 Spider':              'Ferrari_348',
  'Ferrari F40':                     'Ferrari_F40',
  'Ferrari F50':                     'Ferrari_F50',
  'Ferrari 456 GT':                  'Ferrari_456',
  'Ferrari 456M GT':                 'Ferrari_456',
  'Ferrari 456M GTA':                'Ferrari_456',
  'Ferrari 355 Berlinetta':          'Ferrari_F355',
  'Ferrari 355 Spider':              'Ferrari_F355',
  'Ferrari F355 Challenge':          'Ferrari_F355',
  'Ferrari F355 GTS':                'Ferrari_F355',
  'Ferrari 550 Maranello':           'Ferrari_550_Maranello',
  'Ferrari 360 Modena':              'Ferrari_360_Modena',
  'Ferrari 360 Spider':              'Ferrari_360_Modena',
  'Ferrari 575M Maranello':          'Ferrari_575M_Maranello',
  'Ferrari 612 Scaglietti':          'Ferrari_612_Scaglietti',
  'Lamborghini 350GT':               'Lamborghini_350_GT',
  'Lamborghini 400GT 2+2':           'Lamborghini_400_GT',
  'Lamborghini Miura P400':          'Lamborghini_Miura',
  'Lamborghini Miura SV':            'Lamborghini_Miura',
  'Lamborghini Islero':              'Lamborghini_Islero',
  'Lamborghini Espada':              'Lamborghini_Espada',
  'Lamborghini Jarama':              'Lamborghini_Jarama',
  'Lamborghini Urraco P250':         'Lamborghini_Urraco',
  'Lamborghini Countach LP400':      'Lamborghini_Countach',
  'Lamborghini Countach LP500S':     'Lamborghini_Countach',
  'Lamborghini Countach 25th Anniversary': 'Lamborghini_Countach',
  'Lamborghini Jalpa':               'Lamborghini_Jalpa',
  'Lamborghini Diablo':              'Lamborghini_Diablo',
  'Lamborghini Diablo SV':           'Lamborghini_Diablo',
  'Lamborghini Diablo VT':           'Lamborghini_Diablo',
  'Lamborghini Gallardo':            'Lamborghini_Gallardo',
  'Lamborghini Murciélago LP640':    'Lamborghini_Murciélago',
  'Porsche 356A':                    'Porsche_356',
  'Porsche 356B':                    'Porsche_356',
  'Porsche 356 Speedster':           'Porsche_356',
  'Porsche Carrera 2 356':           'Porsche_356',
  'Porsche 904 Carrera GTS':         'Porsche_904',
  'Porsche 911 2.0 Coupé':           'Porsche_911',
  'Porsche 911 S 2.2':               'Porsche_911_classic',
  'Porsche 911 R':                   'Porsche_911_R',
  'Porsche 912':                     'Porsche_912',
  'Porsche 914/6':                   'Porsche_914',
  'Porsche 914/4':                   'Porsche_914',
  'Porsche 911 Carrera RS 2.7':      'Porsche_911_Carrera_RS',
  'Porsche 911 Turbo 3.0 (930)':     'Porsche_930',
  'Porsche 911 Turbo 3.3 (930)':     'Porsche_930',
  'Porsche 911 SC':                  'Porsche_911_classic',
  'Porsche 911 Carrera 3.2':         'Porsche_911_classic',
  'Porsche 944':                     'Porsche_944',
  'Porsche 944 Turbo':               'Porsche_944',
  'Porsche 959':                     'Porsche_959',
  'Porsche 928 S4':                  'Porsche_928',
  'Porsche 968':                     'Porsche_968',
  'Porsche 964 Carrera 2':           'Porsche_964',
  'Porsche 964 RS':                  'Porsche_964',
  'Porsche 993 911 Carrera':         'Porsche_993',
  'Porsche 993 GT2':                 'Porsche_993',
  'Porsche 993 Turbo':               'Porsche_993',
  'Porsche 993 RS':                  'Porsche_993',
  'Porsche 993 Carrera 4S':          'Porsche_993',
  'Porsche 993 Carrera S':           'Porsche_993',
  'Porsche 996 911 Carrera':         'Porsche_996',
  'Porsche 996 GT3':                 'Porsche_996_GT3',
  'Porsche 996 Turbo':               'Porsche_996',
  'Porsche 911 GT3 996':             'Porsche_996_GT3',
  'Porsche 911 GT2 996':             'Porsche_996',
  'Porsche Boxster 986':             'Porsche_Boxster_(986)',
  'Porsche Boxster S 986':           'Porsche_Boxster_(986)',
  'Porsche Carrera GT':              'Porsche_Carrera_GT',
  'Mercedes-Benz 500K':              'Mercedes-Benz_500K',
  'Mercedes-Benz 540K':              'Mercedes-Benz_540K',
  'Mercedes-Benz 300SL Gullwing':    'Mercedes-Benz_300_SL',
  'Mercedes-Benz 300SL Roadster':    'Mercedes-Benz_300_SL',
  'Mercedes-Benz 300SL R107':        'Mercedes-Benz_R107_and_C107',
  'Mercedes-Benz 450SL R107':        'Mercedes-Benz_R107_and_C107',
  'Mercedes-Benz 190SL':             'Mercedes-Benz_190_SL',
  'Mercedes-Benz 220SE Coupé':       'Mercedes-Benz_W128',
  'Mercedes-Benz 450SEL 6.9':        'Mercedes-Benz_W116',
  'Mercedes-Benz 190E 2.3-16':       'Mercedes-Benz_W201',
  'Mercedes-Benz 500E':              'Mercedes-Benz_W124',
  'Mercedes-Benz 300CE AMG':         'Mercedes-Benz_W124',
  'Mercedes-Benz 300SL W198 Roadster clone': 'Mercedes-Benz_300_SL',
  'BMW 507':                         'BMW_507',
  'BMW 2000CS':                      'BMW_2000CS',
  'BMW 2002tii':                     'BMW_2002',
  'BMW 2002 Turbo':                  'BMW_2002_Turbo',
  'BMW 3.0 CSL':                     'BMW_3.0_CSL',
  'BMW 2800CS':                      'BMW_E9',
  'BMW M1':                          'BMW_M1',
  'BMW 635 CSi':                     'BMW_6_Series_(E24)',
  'BMW M635 CSi':                    'BMW_M6_(E24)',
  'BMW E30 325i':                    'BMW_3_Series_(E30)',
  'BMW E30 Cabriolet':               'BMW_3_Series_(E30)',
  'BMW 850CSi':                      'BMW_8_Series_(E31)',
  'BMW E30 M3':                      'BMW_M3_(E30)',
  'BMW M3 E30 Sport Evolution':      'BMW_M3_(E30)',
  'BMW E28 M5':                      'BMW_M5_(E28)',
  'BMW E36 M3':                      'BMW_M3_(E36)',
  'BMW E34 M5':                      'BMW_M5_(E34)',
  'BMW E46 M3':                      'BMW_M3_(E46)',
  'BMW M3 CSL E46':                  'BMW_M3_CSL_(E46)',
  'BMW E39 M5':                      'BMW_M5_(E39)',
  'BMW M5 E60':                      'BMW_M5_(E60)',
  'BMW Z3 M Roadster':               'BMW_Z3_M',
  'BMW Z8':                          'BMW_Z8',
  'BMW Z4 M Roadster':               'BMW_Z4_M',
  'Audi Quattro':                    'Audi_Quattro',
  'Audi Sport Quattro':              'Audi_Sport_quattro',
  'Audi Quattro Sport SWB':          'Audi_Sport_quattro',
  'Ford Model T':                    'Ford_Model_T',
  'Ford Model A':                    'Ford_Model_A_(1927)',
  'Ford Thunderbird 1st Gen':        'Ford_Thunderbird_(first_generation)',
  'Ford Mustang 1st Gen Fastback':   'Ford_Mustang_(first_generation)',
  'Ford Mustang Shelby GT500':       'Shelby_Mustang',
  'Ford Boss 302 Mustang':           'Boss_302_Mustang',
  'Ford Mustang SVT Cobra R':        'Mustang_SVT_Cobra',
  'Ford GT40 Mk1':                   'Ford_GT40',
  'Ford GT90':                       'Ford_GT90',
  'Ford RS200':                      'Ford_RS200',
  'Ford Cortina Mk1 Lotus':          'Ford_Cortina_(Mark_I)',
  'Ford Escort Mk1 RS1600':          'Ford_Escort_Mk1',
  'Ford Escort Mk2 RS2000':          'Ford_Escort_RS2000',
  'Ford Escort Mk1 Mexico':          'Ford_Escort_Mk1',
  'Ford Escort Cosworth':            'Ford_Escort_RS_Cosworth',
  'Ford Escort RS Turbo S2':         'Ford_Escort_RS_Turbo',
  'Ford Fiesta Mk1 XR2':             'Ford_Fiesta_XR2',
  'Ford Sierra RS Cosworth':         'Ford_Sierra_RS_Cosworth',
  'Ford Sierra RS500 Cosworth':      'Ford_Sierra_RS_Cosworth',
  'Ford Capri 2.8i':                 'Ford_Capri',
  'Ford Capri RS3100':               'Ford_Capri',
  'Ford Focus RS Mk1':               'Ford_Focus_RS',
  'Ford Falcon GT':                  'Ford_Falcon_(XY)',
  'AC Ace':                          'AC_Ace',
  'AC Aceca':                        'AC_Aceca',
  'AC Cobra 427':                    'AC_Cobra',
  'Shelby Cobra 289':                'AC_Cobra',
  'Austin Seven':                    'Austin_Seven',
  'Austin Metro Turbo':              'Austin_Metro',
  'Austin-Healey 100/4':             'Austin-Healey_100',
  'Austin-Healey 100M':              'Austin-Healey_100',
  'Austin-Healey 3000 Mk1':          'Austin-Healey_3000',
  'Austin-Healey 3000 Mk3':          'Austin-Healey_3000',
  'MG M-Type Midget':                'MG_M-type',
  'MGA Roadster':                    'MGA',
  'MGA Twin Cam':                    'MGA_Twin_Cam',
  'MGB Roadster':                    'MGB_(car)',
  'MGB GT':                          'MGB_(car)',
  'MG Metro 6R4':                    'MG_Metro_6R4',
  'MG Maestro Turbo':                'MG_Maestro',
  'Mini Cooper S Mk1':               'Mini_(marque)',
  'MINI Cooper S R53':               'Mini_Cooper_(BMW)',
  'Triumph TR2':                     'Triumph_TR2',
  'Triumph TR3':                     'Triumph_TR3',
  'Triumph TR3A':                    'Triumph_TR3',
  'Triumph TR3B':                    'Triumph_TR3',
  'Triumph TR4':                     'Triumph_TR4',
  'Triumph TR4A':                    'Triumph_TR4A',
  'Triumph TR5':                     'Triumph_TR5',
  'Triumph TR6':                     'Triumph_TR6',
  'Triumph Spitfire Mk1':            'Triumph_Spitfire',
  'Triumph GT6':                     'Triumph_GT6',
  'Triumph Stag':                    'Triumph_Stag',
  'Triumph Dolomite Sprint':         'Triumph_Dolomite',
  'Triumph Roadster':                'Triumph_1800/2000_Roadster',
  'Triumph Acclaim':                 'Triumph_Acclaim',
  'TVR Grantura':                    'TVR_Grantura',
  'TVR Tasmin 200':                  'TVR_Tasmin',
  'TVR 350i':                        'TVR_350i',
  'TVR S Series':                    'TVR_S_series',
  'TVR Cerbera 4.2':                 'TVR_Cerbera',
  'TVR Griffith 500':                'TVR_Griffith',
  'TVR Chimaera':                    'TVR_Chimaera',
  'TVR Tuscan Speed Six':            'TVR_Tuscan',
  'TVR T350C':                       'TVR_T350',
  'Lotus Seven S2':                  'Lotus_Seven',
  'Lotus Elan S1':                   'Lotus_Elan',
  'Lotus Elan S4':                   'Lotus_Elan',
  'Lotus Elan +2':                   'Lotus_Elan_+2',
  'Lotus Europa S1':                 'Lotus_Europa',
  'Lotus Elite Type 14':             'Lotus_Elite_(Type_14)',
  'Lotus Elite S2 Type 75':          'Lotus_Elite_(Type_75)',
  'Lotus Cortina Mk2':               'Ford_Cortina_(Mark_II)',
  'Lotus Esprit S1':                 'Lotus_Esprit',
  'Lotus Esprit Turbo':              'Lotus_Esprit',
  'Lotus Carlton':                   'Lotus_Carlton',
  'Vauxhall Lotus Carlton':          'Lotus_Carlton',
  'Lotus Elise S1':                  'Lotus_Elise',
  'Lotus Elise S2':                  'Lotus_Elise',
  'Lotus Elise Sport 135':           'Lotus_Elise',
  'Lotus Exige S1':                  'Lotus_Exige',
  'Caterham Seven':                  'Caterham_7',
  'Caterham CSR 260':                'Caterham_Seven',
  'Alfa Romeo 8C 2300':              'Alfa_Romeo_8C_2300',
  'Alfa Romeo 6C 1750':              'Alfa_Romeo_6C_1750',
  'Alfa Romeo 6C 2300':              'Alfa_Romeo_6C_2300',
  'Alfa Romeo 2900B':                'Alfa_Romeo_8C_2900',
  'Alfa Romeo 1900 Sprint':          'Alfa_Romeo_1900',
  'Alfa Romeo Giulietta Sprint':     'Alfa_Romeo_Giulietta_Sprint',
  'Alfa Romeo Giulietta Spider':     'Alfa_Romeo_Giulietta_Spider',
  'Alfa Romeo Giulia Sprint GTA':    'Alfa_Romeo_GTA',
  'Alfa Romeo Giulia TI Super':      'Alfa_Romeo_Giulia_Ti_Super',
  'Alfa Romeo Giulia Saloon':        'Alfa_Romeo_Giulia_(105)',
  'Alfa Romeo Spider Duetto':        'Alfa_Romeo_Spider_(105/115_series)',
  'Alfa Romeo Spider S2':            'Alfa_Romeo_Spider_(105/115_series)',
  'Alfa Romeo Spider S3':            'Alfa_Romeo_Spider_(105/115_series)',
  'Alfa Romeo Spider (Kamm tail)':   'Alfa_Romeo_Spider_(105/115_series)',
  'Alfa Romeo Junior Zagato':        'Alfa_Romeo_Junior_Zagato',
  'Alfa Romeo Montreal':             'Alfa_Romeo_Montreal',
  'Alfa Romeo 33 Stradale':          'Alfa_Romeo_33_Stradale',
  'Alfa Romeo 33/3':                 'Alfa_Romeo_Tipo_33',
  'Alfa Romeo Tipo 159':             'Alfa_Romeo_159',
  'Alfa Romeo GTV6':                 'Alfa_Romeo_GTV6',
  'Alfa Romeo 75 Turbo Evoluzione':  'Alfa_Romeo_75',
  'Alfa Romeo SZ':                   'Alfa_Romeo_SZ',
  'Alfa Romeo 155 GTA':              'Alfa_Romeo_155',
  'Alfa Romeo GTV V6':               'Alfa_Romeo_GTV_(916)',
  'Alfa Romeo Spider 916':           'Alfa_Romeo_Spider_(916)',
  'Alfa Romeo 156 GTA':              'Alfa_Romeo_156',
  'Alfa Romeo 147 GTA':              'Alfa_Romeo_147',
  'Alfa Romeo 164 Q4':               'Alfa_Romeo_164',
  'Alfa Romeo 164 Cloverleaf':       'Alfa_Romeo_164',
  'Alfa Romeo 8C Competizione':      'Alfa_Romeo_8C',
  'Lancia Lambda':                   'Lancia_Lambda',
  'Lancia Aprilia':                  'Lancia_Aprilia',
  'Lancia Aurelia B20GT':            'Lancia_Aurelia',
  'Lancia Flaminia GT':              'Lancia_Flaminia',
  'Lancia Fulvia HF':                'Lancia_Fulvia',
  'Lancia Stratos':                  'Lancia_Stratos',
  'Lancia Beta Coupé':               'Lancia_Beta',
  'Lancia Beta Montecarlo':          'Lancia_Beta_Montecarlo',
  'Lancia 037 Stradale':             'Lancia_Rally_037',
  'Lancia Delta HF Integrale 16v':   'Lancia_Delta_HF_Integrale',
  'Lancia Delta Integrale Evo 2':    'Lancia_Delta_HF_Integrale',
  'Lancia Thema 8.32':               'Lancia_Thema',
  'Maserati A6GCS':                  'Maserati_A6GCS',
  'Maserati 300S':                   'Maserati_300S',
  'Maserati Mistral':                'Maserati_Mistral',
  'Maserati Sebring':                'Maserati_Sebring',
  'Maserati Ghibli':                 'Maserati_Ghibli_(1966)',
  'Maserati Bora':                   'Maserati_Bora',
  'Maserati Merak':                  'Maserati_Merak',
  'Maserati Khamsin':                'Maserati_Khamsin',
  'Maserati Quattroporte II':        'Maserati_Quattroporte',
  'Maserati Quattroporte III':       'Maserati_Quattroporte',
  'Maserati 3200 GT':                'Maserati_3200_GT',
  'Maserati Spyder Cambiocorsa':     'Maserati_Spyder',
  'Maserati Coupe Cambiocorsa':      'Maserati_Coupé',
  'De Tomaso Mangusta':              'De_Tomaso_Mangusta',
  'De Tomaso Pantera':               'De_Tomaso_Pantera',
  'Pantera GTS':                     'De_Tomaso_Pantera',
  'Pantera GT5':                     'De_Tomaso_Pantera',
  'Bentley 4½ Litre':                'Bentley_4½_Litre',
  'Bentley 4¼ Litre':                'Bentley_4½_Litre',
  'Bentley 3 Litre':                 'Bentley_3_Litre',
  'Bentley Speed Six':               'Bentley_Speed_Six',
  'Bentley 8 Litre':                 'Bentley_8_Litre',
  'Bentley R-Type Continental':      'Bentley_R-Type',
  'Bentley Mulsanne Turbo R':        'Bentley_Turbo_R',
  'Bentley Continental R':           'Bentley_Continental_R',
  'Bentley Arnage T':                'Bentley_Arnage',
  'Bentley Continental GT':          'Bentley_Continental_GT',
  'Rolls-Royce Silver Ghost':        'Rolls-Royce_Silver_Ghost',
  'Rolls-Royce Phantom I':           'Rolls-Royce_Phantom_I',
  'Rolls-Royce Phantom II':          'Rolls-Royce_Phantom_II',
  'Rolls-Royce Phantom III':         'Rolls-Royce_Phantom_III',
  'Rolls-Royce Wraith':              'Rolls-Royce_Wraith_(1938)',
  'Rolls-Royce Corniche':            'Rolls-Royce_Corniche',
  'Rolls-Royce Silver Seraph':       'Rolls-Royce_Silver_Seraph',
  'Rolls-Royce Ghost':               'Rolls-Royce_Ghost',
  'Bugatti Type 35':                 'Bugatti_Type_35',
  'Bugatti Type 35B':                'Bugatti_Type_35',
  'Bugatti Type 40':                 'Bugatti_Type_40',
  'Bugatti Type 43':                 'Bugatti_Type_43',
  'Bugatti Type 55':                 'Bugatti_Type_55',
  'Bugatti Type 57':                 'Bugatti_Type_57',
  'Bugatti EB110 GT':                'Bugatti_EB_110',
  'Bugatti Veyron':                  'Bugatti_Veyron',
  'SS Jaguar 100':                   'SS_Cars',
  'Lagonda V12':                     'Lagonda_V12',
  'Hispano-Suiza J12':               'Hispano-Suiza_J12',
  'Invicta 4½ Litre S-Type':         'Invicta_car',
  'Riley Nine MPH':                  'Riley_Nine',
  'Alvis Speed 25':                  'Alvis_Speed_25',
  'Alvis 12/50':                     'Alvis_12/50',
  'Frazer Nash TT Replica':          'Frazer_Nash_TT_Replica',
  'HRG 1500':                        'HRG_Engineering',
  'Healey Silverstone':              'Healey_Silverstone',
  'Delahaye 135M':                   'Delahaye_135',
  'Delage D8':                       'Delage_D8',
  'Amilcar CGS':                     'Amilcar',
  'Talbot-Lago T150SS':              'Talbot-Lago_T150',
  'Cisitalia 202':                   'Cisitalia_202',
  'Stutz Bearcat':                   'Stutz_Bearcat',
  'Packard Twelve':                  'Packard_Twelve',
  'Cord 810':                        'Cord_810/812',
  'Duesenberg Model J':              'Duesenberg_Model_J',
  'Chrysler 300 Letter Series':      'Chrysler_C-300',
  'Lincoln Continental Mk2':         'Lincoln_Continental_Mark_II',
  'DB Panhard':                      'DB_(automobile)',
  'Sunbeam 3 Litre':                 'Sunbeam_3_Litre',
  'Pegaso Z-102':                    'Pegaso_Z-102',
  'Turner Sports':                   'Turner_(automobile)',
  'BRM P25':                         'BRM_P25',
  'Auto Union Type C':               'Auto_Union_Type_C',
  'Citroën DS19':                    'Citroën_DS',
  'Citroën DS23 Pallas':             'Citroën_DS',
  'Citroën 2CV':                     'Citroën_2CV',
  'Citroën SM':                      'Citroën_SM',
  'Renault Alpine A110':             'Alpine_A110',
  'Renault 5 Turbo':                 'Renault_5_Turbo',
  'Renault GTA V6 Turbo':            'Alpine_GTA',
  'Renault Clio Williams':           'Renault_Clio_Williams',
  'Renault Clio V6 Phase 1':         'Renault_Clio_V6',
  'Renault Sport Spider':            'Renault_Sport_Spider',
  'Renault Megane RS Phase 1':       'Renault_Mégane_RS',
  'Renault Megane R26.R':            'Renault_Mégane_RS',
  'Renault Dauphine Gordini':        'Renault_Dauphine',
  'Peugeot 205 GTI 1.9':             'Peugeot_205_GTI',
  'Peugeot 205 T16':                 'Peugeot_205_Turbo_16',
  'Peugeot 306 GTI-6':               'Peugeot_306',
  'Volkswagen Beetle':               'Volkswagen_Beetle',
  'Volkswagen Scirocco Mk1':         'Volkswagen_Scirocco',
  'VW Golf Mk1 GTI 1.6':             'Volkswagen_Golf_Mk1',
  'VW Golf Mk2 GTI 16v':             'Volkswagen_Golf_Mk2',
  'VW Golf Mk2 G60 Rallye':          'Volkswagen_Golf_Mk2',
  'Volkswagen Golf GTI Mk3':         'Volkswagen_Golf_Mk3',
  'Volkswagen Golf R32 Mk4':         'Volkswagen_Golf_Mk4',
  'Fiat 500 Nuova':                  'Fiat_500_(1957)',
  'Fiat 1100 TV':                    'Fiat_1100',
  'Fiat 8V Zagato':                  'Fiat_8V',
  'Fiat X1/9':                       'Fiat_X1/9',
  'Abarth 750 Zagato':               'Abarth',
  'Iso Grifo':                       'Iso_Grifo',
  'Iso Rivolta GT':                  'Iso_Rivolta_IR_300',
  'Facel Vega HK500':                'Facel_Vega_HK',
  'Simca Aronde Montlhéry':          'Simca_Aronde',
  'Opel GT':                         'Opel_GT',
  'De Lorean DMC-12':                'DMC_DeLorean',
  'Jensen Interceptor Mk1':          'Jensen_Interceptor',
  'Jensen Healey':                   'Jensen-Healey',
  'Morgan Plus 4':                   'Morgan_Plus_4',
  'Morgan Plus 8':                   'Morgan_Plus_8',
  'Ginetta G4':                      'Ginetta_G4',
  'Ginetta G32':                     'Ginetta',
  'Ginetta G27':                     'Ginetta',
  'Ginetta G40 GT5':                 'Ginetta_G40',
  'Marcos GT':                       'Marcos_(car)',
  'Reliant Scimitar GTE':            'Reliant_Scimitar',
  'Rover SD1 Vitesse':               'Rover_SD1',
  'Talbot Sunbeam Lotus':            'Talbot_Sunbeam_Lotus',
  'Talbot Horizon GL':               'Talbot_Horizon',
  'Sunbeam Alpine Series 1':         'Sunbeam_Alpine',
  'Sunbeam Tiger':                   'Sunbeam_Tiger',
  'Volvo P1800':                     'Volvo_P1800',
  'Vauxhall Astra GTE Mk2':          'Vauxhall_Astra',
  'Vauxhall VX220':                  'Vauxhall_VX220',
  'Vauxhall Monaro VXR':             'Holden_Monaro',
  'Westfield SEight':                'Westfield_Seven',
  'Ariel Atom 2':                    'Ariel_Atom',
  'Noble M12 GTO':                   'Noble_M12',
  'Noble M400':                      'Noble_M400',
  'Mosler MT900':                    'Mosler_MT900',
  'Bristol 404':                     'Bristol_404_and_405',
  'Bristol Fighter':                 'Bristol_Fighter',
  'Spyker C8 Spyder':                'Spyker_C8',
  'Pagani Zonda C12':                'Pagani_Zonda',
  'Pagani Zonda S':                  'Pagani_Zonda',
  'Koenigsegg CC8S':                 'Koenigsegg_CC8S',
  'Saleen S7 Twin Turbo':            'Saleen_S7',
  'Honda S600':                      'Honda_S600',
  'Honda S800':                      'Honda_S800',
  'Honda NSX':                       'Honda_NSX',
  'Honda CRX Si':                    'Honda_CR-X',
  'Honda Beat':                      'Honda_Beat_(Japan)',
  'Honda S2000':                     'Honda_S2000',
  'Honda Integra Type R DC2':        'Honda_Integra_Type_R',
  'Honda Civic Type R EK9':          'Honda_Civic_Type_R_(EK9)',
  'Honda Civic Type R EP3':          'Honda_Civic_Type_R_(EP3)',
  'Datsun 240Z':                     'Nissan_S30',
  'Nissan Skyline GT-R R33':         'Nissan_Skyline_GT-R_(R33)',
  'Nissan Skyline GT-R R34':         'Nissan_Skyline_GT-R_(R34)',
  'Nissan 300ZX Z32':                'Nissan_300ZX',
  'Mazda Cosmo Sport':               'Mazda_Cosmo',
  'Mazda RX-7 SA22C':                'Mazda_RX-7_(SA22C)',
  'Mazda RX-7 FC':                   'Mazda_RX-7_(FC)',
  'Mazda RX-7 FD':                   'Mazda_RX-7',
  'Mazda MX-5 Mk1 NA':               'Mazda_MX-5_(NA)',
  'Mazda MX-5 Mk2 NB':               'Mazda_MX-5_(NB)',
  'Toyota 2000GT':                   'Toyota_2000GT',
  'Toyota Supra Mk4 Twin Turbo':     'Toyota_Supra_(A80)',
  'Toyota MR2 Mk2 Turbo':            'Toyota_MR2',
  'Toyota GT-Four ST205':            'Toyota_Celica',
  'Subaru Impreza WRX STi':          'Subaru_Impreza_WRX_STI',
  'Subaru Impreza STi Spec C':       'Subaru_Impreza_WRX_STI',
  'Mitsubishi Lancer Evo 6 TME':     'Mitsubishi_Lancer_Evolution',
  'Mitsubishi Lancer Evo 3':         'Mitsubishi_Lancer_Evolution_III',
  'Mitsubishi Lancer Evo IX MR':     'Mitsubishi_Lancer_Evolution_IX',
  'Mitsubishi GTO Twin Turbo':       'Mitsubishi_GTO',
  'Mitsubishi Starion Turbo':        'Mitsubishi_Starion',
  'Isuzu Piazza Turbo':              'Isuzu_Piazza',
  'Proton Satria GTi':               'Proton_Satria',
  'SEAT Cupra R Ibiza Mk3':          'SEAT_Ibiza',
  'Chevrolet Corvette C1':           'Chevrolet_Corvette_(C1)',
  'Chevrolet Corvette C2 Stingray':  'Chevrolet_Corvette_(C2)',
  'Chevrolet Corvette C4 ZR1':       'Chevrolet_Corvette_(C4)',
  'Chevrolet Camaro Z/28 1st Gen':   'Chevrolet_Camaro_(first_generation)',
  'Chevrolet Camaro SS 4th Gen':     'Chevrolet_Camaro_(fourth_generation)',
  'Pontiac GTO 1st Gen':             'Pontiac_GTO_(1964–1967)',
  'Pontiac GTO 2004':                'Pontiac_GTO_(2004)',
  'Pontiac Firebird Trans Am':       'Pontiac_Firebird',
  'Buick Riviera 1st Gen':           'Buick_Riviera',
  'Oldsmobile Toronado':             'Oldsmobile_Toronado',
  'Dodge Charger R/T 1969':          'Dodge_Charger_(B-body)',
  'Dodge Challenger R/T':            'Dodge_Challenger_(1970)',
  'Dodge Challenger SRT Hellcat':    'Dodge_Challenger_(2008)',
  "Plymouth Barracuda 'Cuda 440":    'Plymouth_Barracuda',
  'Chrysler 300 Letter Series':      'Chrysler_C-300',
  'Chrysler Prowler':                'Plymouth_Prowler',
  'Chrysler 300C SRT8':              'Chrysler_300',
  'Dodge Viper GTS':                 'Dodge_Viper',
  'Dodge Viper RT/10':               'Dodge_Viper_(SR_I)',
  'Dodge Viper SRT-10':              'Dodge_Viper_(SR_III)',
};
