(() => {
  const games = [
    {id:'ac', name:'Assetto Corsa', short:'AC', accent:'#e9ecef'},
    {id:'acc', name:'Assetto Corsa Competizione', short:'ACC', accent:'#f1c40f'},
    {id:'iracing', name:'iRacing', short:'iR', accent:'#2f80ed'},
    {id:'f1', name:'EA SPORTS F1', short:'F1', accent:'#e10600'},
    {id:'ace', name:'Assetto Corsa EVO', short:'ACE', accent:'#ff5b35'},
    {id:'rf2', name:'rFactor 2', short:'rF2', accent:'#f97316'},
    {id:'lmu', name:'Le Mans Ultimate', short:'LMU', accent:'#32d583'},
    {id:'ams2', name:'Automobilista 2', short:'AMS2', accent:'#06b6d4'},
    {id:'raceroom', name:'RaceRoom', short:'RR', accent:'#f43f5e'},
    {id:'other', name:'Другая игра', short:'SIM', accent:'#8a7dff'}
  ];

  const tracks = [
    {id:'spa', name:'Spa-Francorchamps', country:'Бельгия', length:7.004, configs:['Grand Prix'], games:['ac','acc','iracing','f1','ace'], type:'road', difficulty:5, corners:19, path:'M18 68 C35 52,42 20,68 22 C96 23,103 47,87 58 C75 66,91 92,67 96 C49 99,48 81,31 84 C18 87,8 80,18 68 Z'},
    {id:'monza', name:'Monza', country:'Италия', length:5.793, configs:['Grand Prix'], games:['ac','acc','iracing','f1','ace'], type:'road', difficulty:3, corners:11, path:'M29 91 C16 82,18 63,27 51 L45 18 C53 4,71 8,76 22 L85 46 C89 57,83 69,71 72 L52 78 C45 81,42 95,29 91 Z'},
    {id:'nurburgring', name:'Nürburgring', country:'Германия', length:5.148, configs:['Grand Prix','Sprint','Müllenbach','Nordschleife','24h'], games:['ac','acc','iracing','f1','ace','rf2','ams2'], type:'road', difficulty:4, corners:15, path:'M20 75 C14 61,27 47,22 33 C18 21,32 13,45 19 C55 24,63 10,77 15 C91 20,94 38,82 47 C70 55,88 68,78 82 C66 99,47 83,35 92 C25 98,22 87,20 75 Z'},
    {id:'silverstone', name:'Silverstone', country:'Великобритания', length:5.891, configs:['Grand Prix','International','National','Stowe'], games:['ac','acc','iracing','f1','ace','rf2','ams2'], type:'road', difficulty:4, corners:18, path:'M14 68 L24 43 L39 39 L41 18 L62 24 L72 14 L91 32 L79 47 L93 63 L74 80 L56 73 L43 93 L28 81 Z'},
    {id:'suzuka', name:'Suzuka', country:'Япония', length:5.807, configs:['Grand Prix','East','West'], games:['ac','iracing','f1','rf2'], type:'road', difficulty:5, corners:18, path:'M19 33 C33 11,58 14,60 34 C61 48,42 50,35 61 C28 72,41 92,57 86 C74 80,68 62,81 54 C94 47,96 70,82 77 C68 85,61 65,50 64 C38 63,32 49,19 53 C7 56,8 42,19 33 Z'},
    {id:'imola', name:'Imola', country:'Италия', length:4.909, configs:['Grand Prix','Historic'], games:['ac','acc','iracing','f1','ace','rf2','lmu'], type:'road', difficulty:4, corners:19, path:'M18 77 C7 61,18 47,31 43 L42 19 C47 8,63 12,66 25 L70 42 C74 51,90 47,93 61 C96 75,82 86,69 80 L53 72 C43 67,35 88,18 77 Z'},
    {id:'redbullring', name:'Red Bull Ring', country:'Австрия', length:4.318, configs:['Grand Prix','National','Short'], games:['ac','acc','iracing','f1','ace','ams2'], type:'road', difficulty:3, corners:10, path:'M16 76 C26 60,37 49,49 35 L68 14 C74 7,86 13,82 24 L72 49 C68 59,87 65,83 78 C79 91,59 93,48 84 C39 77,26 92,16 76 Z'},
    {id:'brands', name:'Brands Hatch', country:'Великобритания', length:3.916, configs:['Grand Prix','Indy'], games:['ac','acc','iracing'], type:'road', difficulty:4, corners:9, path:'M23 22 C37 7,56 15,57 32 C58 43,45 47,49 59 C53 72,78 62,82 78 C86 94,65 98,55 86 C47 76,33 91,22 79 C11 67,24 55,18 44 C13 35,15 29,23 22 Z'},
    {id:'laguna', name:'Laguna Seca', country:'США', length:3.602, configs:['Full Course','Club'], games:['ac','iracing','ams2'], type:'road', difficulty:4, corners:11, path:'M16 57 C13 40,26 27,43 30 C53 32,57 12,72 16 C85 20,82 39,72 45 C60 53,91 61,84 78 C76 96,53 82,39 88 C23 95,10 79,16 57 Z'},
    {id:'watkins', name:'Watkins Glen', country:'США', length:5.472, configs:['Boot','Classic','Short'], games:['ac','iracing','ams2'], type:'road', difficulty:4, corners:11, path:'M24 88 C14 76,19 61,31 55 C42 50,32 32,43 20 C54 9,72 15,74 31 C75 44,91 48,86 63 C81 78,65 71,57 84 C48 99,34 99,24 88 Z'},
    {id:'daytona', name:'Daytona', country:'США', length:5.729, configs:['Road Course','Road Short','Moto','Oval'], games:['ac','iracing','ams2','raceroom'], type:'mixed', difficulty:3, corners:12, path:'M16 51 C17 25,38 12,61 17 C84 22,95 43,88 66 C82 87,59 96,38 87 C17 78,8 65,16 51 Z M39 45 C49 34,65 37,70 49 C74 61,62 70,50 65 C39 61,32 53,39 45 Z'},
    {id:'cota', name:'Circuit of the Americas', country:'США', length:5.513, configs:['Grand Prix'], games:['ac','iracing','f1','ace'], type:'road', difficulty:5, corners:20, path:'M12 71 L25 49 L18 30 L38 17 L52 31 L66 13 L87 25 L76 42 L92 56 L74 70 L82 89 L59 85 L46 96 L34 78 Z'},
    {id:'interlagos', name:'Interlagos', country:'Бразилия', length:4.309, configs:['Grand Prix'], games:['ac','iracing','f1'], type:'road', difficulty:4, corners:15, path:'M19 38 C23 18,46 10,61 22 C73 32,88 29,91 45 C94 60,77 68,71 80 C64 95,43 94,35 80 C27 66,11 61,19 38 Z'},
    {id:'zandvoort', name:'Zandvoort', country:'Нидерланды', length:4.259, configs:['Grand Prix'], games:['ac','acc','iracing','f1'], type:'road', difficulty:4, corners:14, path:'M18 78 C10 64,20 49,32 46 C44 42,32 23,45 15 C58 7,72 17,71 31 C70 46,92 45,91 61 C90 78,72 83,61 77 C51 72,46 93,30 91 C24 90,20 85,18 78 Z'},
    {id:'mountpanorama', name:'Mount Panorama', country:'Австралия', length:6.213, configs:['Bathurst'], games:['ac','acc','iracing'], type:'road', difficulty:5, corners:23, path:'M18 86 C11 74,17 58,29 53 L42 47 L49 17 C52 6,66 10,68 21 L71 46 C73 56,89 62,85 77 C80 95,58 92,46 80 C35 70,28 98,18 86 Z'},
    {id:'paulricard', name:'Paul Ricard', country:'Франция', length:5.842, configs:['1A-V2','1C-V2','GT'], games:['ac','acc','rf2'], type:'road', difficulty:3, corners:15, path:'M14 54 L35 16 L55 19 L70 10 L92 27 L76 48 L90 69 L68 89 L49 76 L29 92 L17 72 Z'},
    {id:'hungaroring', name:'Hungaroring', country:'Венгрия', length:4.381, configs:['Grand Prix'], games:['ac','acc','iracing','f1'], type:'road', difficulty:4, corners:14, path:'M20 43 C27 17,55 10,69 27 C81 42,72 54,86 63 C97 71,87 88,73 85 C58 82,52 68,39 77 C23 88,9 70,20 43 Z'},
    {id:'barcelona', name:'Barcelona-Catalunya', country:'Испания', length:4.657, configs:['Grand Prix','GP no chicane','National'], games:['ac','acc','iracing','f1','rf2'], type:'road', difficulty:4, corners:14, path:'M16 67 C20 51,35 47,30 31 C25 16,45 10,57 19 C69 28,81 17,88 31 C94 44,81 53,73 60 C65 67,82 82,68 90 C54 98,42 80,31 84 C19 88,10 80,16 67 Z'},
    {id:'lemans', name:'Le Mans', country:'Франция', length:13.626, configs:['Circuit de la Sarthe','No Chicanes','Bugatti'], games:['ac','iracing','lmu'], type:'road', difficulty:5, corners:38, path:'M16 76 L29 50 L23 26 L43 15 L56 31 L70 12 L86 21 L80 50 L93 68 L76 88 L56 78 L39 95 L28 79 Z'},
    {id:'sebring', name:'Sebring', country:'США', length:6.019, configs:['International','Short'], games:['iracing','rf2','lmu'], type:'road', difficulty:4, corners:17, path:'M18 64 C24 40,47 30,61 35 C74 39,79 58,89 66 C94 78,77 90,63 82 C52 68,40 93,24 87 C8 80,10 71,18 64 Z'},
    {id:'roadatlanta', name:'Road Atlanta', country:'США', length:4.088, configs:['Full','Short'], games:['iracing','rf2','ams2'], type:'road', difficulty:4, corners:12, path:'M18 76 C11 60,28 46,44 46 C56 45,51 27,64 20 C79 12,92 27,85 42 C79 56,94 64,81 73 C61 84,49 72,37 85 C23 97,19 87,18 76 Z'},
    {id:'misano', name:'Misano', country:'Италия', length:4.226, configs:['GP','Short'], games:['acc','rf2','ams2'], type:'road', difficulty:3, corners:16, path:'M16 60 C22 43,33 34,47 34 C61 34,69 19,81 24 C92 30,92 47,80 56 C68 64,75 81,62 89 C41 95,24 84,16 60 Z'},
    {id:'donington', name:'Donington Park', country:'Великобритания', length:4.020, configs:['Grand Prix','National'], games:['ac','acc','rf2','ams2'], type:'road', difficulty:3, corners:12, path:'M15 73 C14 51,27 33,44 28 C58 24,61 9,77 15 C91 22,88 42,79 51 C67 60,81 78,64 87 C42 94,24 88,15 73 Z'},
    {id:'bahrain', name:'Bahrain', country:'Бахрейн', length:5.412, configs:['Grand Prix','Outer','Endurance'], games:['ac','f1','rf2','ams2'], type:'road', difficulty:3, corners:15, path:'M17 69 L27 44 L22 24 L44 18 L62 32 L81 21 L91 40 L77 55 L87 73 L64 89 L45 82 L28 93 L18 69 Z'},
    {id:'jeddah', name:'Jeddah Corniche', country:'Саудовская Аравия', length:6.174, configs:['Grand Prix'], games:['f1','ac'], type:'road', difficulty:5, corners:27, path:'M20 87 C11 72,15 54,32 49 C50 45,56 21,71 18 C86 16,95 31,88 46 C81 59,92 76,78 80 C58 83,52 96,34 95 C20 93,14 91,20 87 Z'},
    {id:'drift', name:'Drift Playground', country:'Виртуальная', length:1.8, configs:['Open','Technical','Gymkhana'], games:['ac','other'], type:'drift', difficulty:3, corners:14, path:'M15 53 C17 30,36 22,52 36 C65 48,75 22,88 35 C99 47,82 62,68 57 C52 51,57 82,38 84 C20 86,8 70,15 53 Z'}
  ];

  const cars = [
    {id:'m4gt3', name:'BMW M4 GT3', class:'GT3', games:['acc','iracing','ace'], drivetrain:'RWD', power:590, weight:1275},
    {id:'296gt3', name:'Ferrari 296 GT3', class:'GT3', games:['acc','iracing','ace'], drivetrain:'RWD', power:600, weight:1250},
    {id:'911gt3r', name:'Porsche 911 GT3 R (992)', class:'GT3', games:['acc','iracing','ace'], drivetrain:'RWD', power:565, weight:1250},
    {id:'amggt3', name:'Mercedes-AMG GT3 EVO', class:'GT3', games:['acc','iracing'], drivetrain:'RWD', power:550, weight:1285},
    {id:'huracangt3', name:'Lamborghini Huracán GT3 EVO2', class:'GT3', games:['acc','iracing','ace'], drivetrain:'RWD', power:585, weight:1230},
    {id:'r8gt3', name:'Audi R8 LMS GT3 EVO II', class:'GT3', games:['acc','iracing'], drivetrain:'RWD', power:585, weight:1235},
    {id:'720gt3', name:'McLaren 720S GT3 Evo', class:'GT3', games:['acc','iracing'], drivetrain:'RWD', power:560, weight:1280},
    {id:'vantagegt3', name:'Aston Martin V8 Vantage GT3', class:'GT3', games:['acc','iracing'], drivetrain:'RWD', power:535, weight:1280},
    {id:'corvettegt3', name:'Chevrolet Corvette Z06 GT3.R', class:'GT3', games:['iracing'], drivetrain:'RWD', power:600, weight:1240},
    {id:'mustanggt3', name:'Ford Mustang GT3', class:'GT3', games:['acc','iracing'], drivetrain:'RWD', power:550, weight:1300},
    {id:'mx5', name:'Mazda MX-5 Cup', class:'Cup', games:['ac','iracing'], drivetrain:'RWD', power:181, weight:960},
    {id:'gr86', name:'Toyota GR86', class:'Cup', games:['ac','iracing','ace'], drivetrain:'RWD', power:228, weight:1270},
    {id:'gt4cayman', name:'Porsche 718 Cayman GT4 Clubsport', class:'GT4', games:['acc','iracing','ace'], drivetrain:'RWD', power:425, weight:1320},
    {id:'m4gt4', name:'BMW M4 GT4', class:'GT4', games:['acc','iracing'], drivetrain:'RWD', power:430, weight:1430},
    {id:'f4', name:'FIA F4', class:'Formula', games:['iracing'], drivetrain:'RWD', power:160, weight:570},
    {id:'sf23', name:'Super Formula SF23', class:'Formula', games:['iracing'], drivetrain:'RWD', power:550, weight:670},
    {id:'w13', name:'Formula Hybrid 2022', class:'Formula', games:['ac','f1'], drivetrain:'RWD', power:1000, weight:798},
    {id:'f124', name:'F1 2024 Car', class:'Formula', games:['f1'], drivetrain:'RWD', power:1000, weight:798},
    {id:'f2004', name:'Ferrari F2004', class:'Formula Classic', games:['ac','ace'], drivetrain:'RWD', power:865, weight:605},
    {id:'lmp2', name:'Dallara P217', class:'LMP2', games:['iracing','rf2','lmu'], drivetrain:'RWD', power:600, weight:930},
    {id:'499p', name:'Ferrari 499P', class:'Hypercar', games:['iracing','ace','lmu'], drivetrain:'AWD', power:680, weight:1030},
    {id:'963', name:'Porsche 963 GTP', class:'GTP', games:['iracing'], drivetrain:'RWD', power:680, weight:1030},
    {id:'bmwmhybrid', name:'BMW M Hybrid V8', class:'GTP', games:['iracing'], drivetrain:'RWD', power:680, weight:1030},
    {id:'e30drift', name:'BMW E30 Drift', class:'Drift', games:['ac'], drivetrain:'RWD', power:420, weight:1150},
    {id:'s15drift', name:'Nissan Silvia S15 Drift', class:'Drift', games:['ac'], drivetrain:'RWD', power:600, weight:1250},
    {id:'ae86', name:'Toyota AE86 Tuned', class:'Drift', games:['ac'], drivetrain:'RWD', power:260, weight:920},
    {id:'rs3tcr', name:'Audi RS 3 LMS TCR', class:'TCR', games:['iracing'], drivetrain:'FWD', power:340, weight:1265},
    {id:'civicTCR', name:'Honda Civic Type R TCR', class:'TCR', games:['iracing'], drivetrain:'FWD', power:340, weight:1265},
    {id:'992cup', name:'Porsche 911 GT3 Cup (992)', class:'Cup', games:['acc','iracing','ace'], drivetrain:'RWD', power:510, weight:1260},
    {id:'roadcar', name:'Дорожный автомобиль', class:'Road', games:['ac','ace','other'], drivetrain:'RWD', power:300, weight:1450}
  ];

  const guidePhotos = [
    'assets/guides/spa.jpg',
    'assets/guides/monza.jpg',
    'assets/guides/silverstone.jpg',
    'assets/guides/suzuka.jpg',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=78'
  ];

  const guides = [
    {track:'spa', level:'Продвинутый', photo:guidePhotos[0], summary:'Ритм, смелость на скоростных связках и точный выход на длинные прямые.', sectors:[
      {name:'La Source', gear:'1–2', tip:'Тормози по прямой, поздно доворачивай и не жертвуй разгоном к Eau Rouge.'},
      {name:'Eau Rouge / Raidillon', gear:'5–6', tip:'Подготовь машину слева, сделай один чистый поворот руля и избегай лишнего бордюра.'},
      {name:'Les Combes', gear:'2–3', tip:'Главная точка обгона. Стабилизируй машину до смены направления.'},
      {name:'Pouhon', gear:'4–5', tip:'Мягкий отпуск газа важнее резкого торможения. Второй апекс определяет скорость.'},
      {name:'Bus Stop', gear:'1–2', tip:'Не атакуй первый поребрик слишком глубоко — важнее ранний газ на финишную прямую.'}
    ], setup:['Средняя прижимная сила','Стабильная задняя ось','Давление в рабочем окне после 3 кругов'], mistakes:['Ранний апекс La Source','Двойное движение рулём в Raidillon','Слишком агрессивный вход в Pouhon']},
    {track:'monza', level:'Средний', photo:guidePhotos[1], summary:'Минимальное сопротивление, сильное торможение и идеальные выходы из шикан.', sectors:[
      {name:'Rettifilo', gear:'1–2', tip:'Тормози максимально прямо; первый бордюр режь умеренно, второй используй для распрямления.'},
      {name:'Roggia', gear:'2–3', tip:'Оставь запас на холодных шинах и стабилизируй заднюю ось перед вторым апексом.'},
      {name:'Lesmo 1–2', gear:'3–4', tip:'Поздний апекс и ранний газ. Ошибка на Lesmo 2 дорого стоит на Serraglio.'},
      {name:'Ascari', gear:'3–5', tip:'Смотри на выход, не на первый поребрик. Балансируй машину коротким lift.'},
      {name:'Parabolica', gear:'3–4', tip:'Плавный вход, терпение до апекса и полный газ без коррекций.'}
    ], setup:['Низкое крыло','Мягче задние пружины для поребриков','Удлинённые передачи'], mistakes:['Перетормаживание в T1','Ранний газ на Roggia','Слишком много руля в Parabolica']},
    {track:'silverstone', level:'Продвинутый', photo:guidePhotos[2], summary:'Высокая средняя скорость, точный баланс и уверенность в длинных дугах.', sectors:[
      {name:'Abbey / Farm', gear:'6–7', tip:'Минимальный lift и ранняя подготовка к Village.'},
      {name:'Village / Loop', gear:'1–3', tip:'Не торопись с газом в Loop — важен выход на Aintree.'},
      {name:'Brooklands / Luffield', gear:'2–4', tip:'Собери двойной апекс и открой руль раньше.'},
      {name:'Maggotts / Becketts', gear:'4–7', tip:'Каждый следующий апекс важнее предыдущего. Снимай скорость постепенно.'},
      {name:'Stowe / Vale', gear:'2–5', tip:'Используй всю ширину и избегай позднего торможения с повернутым рулём.'}
    ], setup:['Высокая стабильность в быстрых поворотах','Умеренное крыло','Контроль температуры передней левой'], mistakes:['Атака первого апекса Maggotts','Ранний газ Luffield','Недогрев передних шин']},
    {track:'suzuka', level:'Эксперт', photo:guidePhotos[3], summary:'Трасса на точность: первая ошибка разрушает всю последовательность.', sectors:[
      {name:'Turn 1–2', gear:'3–5', tip:'Первый апекс — подготовка. Основное замедление перенеси между поворотами.'},
      {name:'S Curves', gear:'3–5', tip:'Ритм строится на раннем взгляде. Не ускоряйся там, где придётся сразу отпускать.'},
      {name:'Degner', gear:'3–5', tip:'Короткое торможение и чистый первый апекс; второй не прощает широкого входа.'},
      {name:'Spoon', gear:'3–4', tip:'Поздний второй апекс даёт скорость на длинную прямую.'},
      {name:'130R / Chicane', gear:'2–7', tip:'Стабилизируй машину до торможения в шикану.'}
    ], setup:['Сбалансированное среднее крыло','Хорошая реакция на смену направления','Не слишком жёсткие бордюры'], mistakes:['Слишком быстрый вход в S Curves','Ранний апекс Spoon','Коррекция руля в 130R']},
    {track:'mountpanorama', level:'Эксперт', photo:guidePhotos[4], summary:'Минимум места для ошибки: тормозные точки и доверие к машине важнее абсолютной атаки.', sectors:[
      {name:'Hell Corner', gear:'2–3', tip:'Поздний апекс и ранний газ на Mountain Straight.'},
      {name:'The Cutting', gear:'2–3', tip:'Не перегружай заднюю ось на подъёме; тормози раньше, чем подсказывает инстинкт.'},
      {name:'Skyline / Esses', gear:'2–4', tip:'Сбрасывай скорость до перегиба. После него торможение почти не работает.'},
      {name:'The Chase', gear:'2–6', tip:'Тормози строго прямо и не атакуй первый бордюр.'},
      {name:'Murray’s', gear:'2', tip:'Приоритет — выход и отсутствие пробуксовки.'}
    ], setup:['Стабильность на торможении','Среднее крыло','Мягкое прохождение неровностей'], mistakes:['Позднее торможение в Skyline','Контакт со стеной на выходе The Cutting','Перегрев тормозов']},
    {track:'zandvoort', level:'Продвинутый', photo:guidePhotos[0], summary:'Рельеф, бэнкинг и узкая гоночная линия требуют заранее собранной машины.', sectors:[
      {name:'Tarzan', gear:'2–3', tip:'Позднее торможение возможно, но не теряй внутреннюю линию.'},
      {name:'Hugenholtz', gear:'2–3', tip:'Используй бэнкинг и дай машине довернуть под газом.'},
      {name:'Scheivlak', gear:'5–6', tip:'Один вход и ранний взгляд на выход.'},
      {name:'Hans Ernst', gear:'2–3', tip:'Не переезжай высокий внутренний поребрик.'},
      {name:'Arie Luyendyk', gear:'5–7', tip:'Полный газ зависит от баланса и давления шин.'}
    ], setup:['Стабильная передняя ось','Средне-высокое крыло','Контроль давления справа'], mistakes:['Широкий выход Tarzan','Слишком резкий газ Hugenholtz','Атака поребрика Hans Ernst']},
    {track:'imola', level:'Продвинутый', photo:guidePhotos[1], summary:'Поребрики, перепады высот и важность правильного позиционирования.', sectors:[
      {name:'Tamburello', gear:'2–4', tip:'Тормози прямо, первый апекс не атакуй чрезмерно.'},
      {name:'Villeneuve', gear:'3–5', tip:'Стабильность важнее минимальной скорости.'},
      {name:'Tosa', gear:'2', tip:'Поздний апекс и максимально ранний газ в подъём.'},
      {name:'Acque Minerali', gear:'2–4', tip:'Перенеси вес до второго поворота и не спеши с разгоном.'},
      {name:'Rivazza', gear:'2–3', tip:'Два разных апекса: первый — замедление, второй — выход.'}
    ], setup:['Податливая подвеска','Средняя прижимная сила','Хорошее торможение на неровностях'], mistakes:['Слишком высокий поребрик Tamburello','Ранний апекс Tosa','Потеря задней оси Acque Minerali']},
    {track:'laguna', level:'Средний', photo:guidePhotos[2], summary:'Небольшая трасса, где точность в медленных поворотах решает всё.', sectors:[
      {name:'Andretti Hairpin', gear:'2', tip:'Собери поздний второй апекс и не перегрузи передние шины.'},
      {name:'Turn 4', gear:'3–4', tip:'Ранний газ возможен только при чистом входе.'},
      {name:'Turn 6', gear:'3–4', tip:'Используй компрессию, но не выезжай широко.'},
      {name:'Corkscrew', gear:'2–3', tip:'Тормози до гребня, ориентируйся на дерево/маркер и позволь машине упасть внутрь.'},
      {name:'Rainey', gear:'3–4', tip:'Сохрани минимальную скорость без лишнего скольжения.'}
    ], setup:['Механическое сцепление','Среднее крыло','Стабильные тормоза на спуске'], mistakes:['Поздний вход в Corkscrew','Недостаточный поворот в Andretti','Перегрев передних шин']}
  ];



  guides.push(
    {track:'nurburgring',level:'Продвинутый',photo:guidePhotos[4],summary:'Комбинация медленных шпилек, связок и зон, где важнее подготовка выхода, чем позднее торможение.',sectors:[
      {name:'Yokohama-S',gear:'2–3',tip:'Тормози прямо и не жертвуй выходом из второй части связки.'},
      {name:'Mercedes Arena',gear:'2–3',tip:'Собери поздний апекс и не перегружай переднюю ось.'},
      {name:'Schumacher-S',gear:'5–6',tip:'Один плавный поворот руля и стабильная платформа.'},
      {name:'Veedol Chicane',gear:'2–3',tip:'Контролируй поребрик: слишком глубокая атака разрушает выход.'},
      {name:'Coca-Cola',gear:'2–3',tip:'Поздний апекс открывает полный газ на прямую.'}
    ],setup:['Стабильность на торможении','Среднее крыло','Контроль поребриков'],mistakes:['Ранний апекс Mercedes Arena','Лишняя коррекция в Schumacher-S','Слишком высокий поребрик Veedol']},
    {track:'cota',level:'Эксперт',photo:guidePhotos[0],summary:'Резкие смены направления, длинные дуги и несколько разных типов торможения в одном круге.',sectors:[
      {name:'Turn 1',gear:'1–2',tip:'Используй подъём для позднего торможения, но сохрани внутреннюю линию.'},
      {name:'Esses 3–6',gear:'4–6',tip:'Каждый следующий апекс важнее предыдущего; не атакуй первый слишком сильно.'},
      {name:'Turn 11',gear:'1–2',tip:'Поздний апекс и ранний газ на длинную прямую.'},
      {name:'Turn 12',gear:'1–2',tip:'Главная точка обгона: тормози строго прямо.'},
      {name:'Turn 16–18',gear:'4–5',tip:'Держи постоянную дугу и избегай лишнего скольжения передних шин.'}
    ],setup:['Средне-высокое крыло','Хорошая ротация в медленных поворотах','Защита передних шин'],mistakes:['Слишком ранний вход в Esses','Потеря выхода T11','Перегрев передних шин в T16–18']},
    {track:'interlagos',level:'Продвинутый',photo:guidePhotos[2],summary:'Короткий круг с перепадом высот: решают выход из Senna S и тяга на подъёме к финишу.',sectors:[
      {name:'Senna S',gear:'2–4',tip:'Первый апекс — подготовка, второй определяет разгон вниз.'},
      {name:'Descida do Lago',gear:'2–4',tip:'Тормози прямо и собери поздний второй апекс.'},
      {name:'Ferradura',gear:'3–4',tip:'Плавный вход и терпение с газом сохраняют задние шины.'},
      {name:'Bico de Pato',gear:'1–2',tip:'Не торопись с апексом: важен выход на подъём.'},
      {name:'Junção',gear:'2–3',tip:'Ранний газ при распрямлённом руле даёт скорость до финиша.'}
    ],setup:['Хорошая тяга','Среднее крыло','Контроль задних шин'],mistakes:['Слишком ранний апекс Senna S','Пробуксовка в Bico de Pato','Широкий выход Junção']},
    {track:'lemans',level:'Эксперт',photo:guidePhotos[4],summary:'Длинный endurance-круг: низкое сопротивление должно сочетаться со стабильностью на торможении.',sectors:[
      {name:'Dunlop Chicane',gear:'2–4',tip:'Тормози прямо и не атакуй второй поребрик слишком жёстко.'},
      {name:'Tertre Rouge',gear:'3–4',tip:'Поздний апекс максимизирует скорость на Mulsanne.'},
      {name:'Mulsanne Chicanes',gear:'2–6',tip:'Стабильность на высокоскоростном торможении важнее последнего метра.'},
      {name:'Indianapolis / Arnage',gear:'1–4',tip:'Раздели торможение и поворот; Arnage требует терпения.'},
      {name:'Porsche Curves',gear:'5–6',tip:'Один ритм и минимальные коррекции — ключ к стабильности.'}
    ],setup:['Низкое сопротивление','Стабильная платформа','Надёжные тормоза'],mistakes:['Ранний апекс Tertre Rouge','Нестабильность Mulsanne','Лишние коррекции Porsche Curves']},
    {track:'daytona',level:'Средний',photo:guidePhotos[1],summary:'Сочетание бэнкинга и медленного infield требует компромисса между скоростью и механическим сцеплением.',sectors:[
      {name:'Turn 1',gear:'2–4',tip:'Тормози на переходе с бэнкинга и не перегружай внутреннюю переднюю шину.'},
      {name:'International Horseshoe',gear:'1–2',tip:'Поздний апекс и чистая тяга важнее скорости входа.'},
      {name:'West Horseshoe',gear:'2–3',tip:'Стабилизируй машину до газа и не выезжай на грязную часть.'},
      {name:'Bus Stop',gear:'3–6',tip:'Чистый первый поворот задаёт всю шикану; используй бордюры дозированно.'},
      {name:'NASCAR Turns',gear:'6–7',tip:'Минимум движений рулём и контроль температуры шин.'}
    ],setup:['Низкое сопротивление','Стабильность на бэнкинге','Механическое сцепление infield'],mistakes:['Позднее торможение T1','Ранний газ Horseshoe','Слишком глубокий первый поребрик Bus Stop']},
    {track:'brands',level:'Продвинутый',photo:guidePhotos[3],summary:'Узкая трасса с перепадами высот: точность позиционирования важнее широкой атаки.',sectors:[
      {name:'Paddock Hill Bend',gear:'3–4',tip:'Тормози до гребня и дай машине опуститься к позднему апексу.'},
      {name:'Druids',gear:'1–2',tip:'Не торопись с газом: выход определяет следующий спуск.'},
      {name:'Graham Hill Bend',gear:'2–3',tip:'Используй ширину входа и не режь внутренний поребрик.'},
      {name:'Hawthorn Bend',gear:'4–5',tip:'Стабильная платформа и один поворот руля.'},
      {name:'Clark Curve',gear:'3–4',tip:'Приоритет выхода на Brabham Straight.'}
    ],setup:['Среднее крыло','Стабильность на перепадах','Хорошая тяга'],mistakes:['Широкий выход Paddock Hill','Ранний газ Druids','Атака внутреннего поребрика Graham Hill']}
  );

  const localGuidePhotos = {
    spa:'assets/guides/spa.jpg',
    monza:'assets/guides/monza.jpg',
    silverstone:'assets/guides/silverstone.jpg',
    suzuka:'assets/guides/suzuka.jpg'
  };
  const trainingModes = [
    {id:'quali',name:'Квалификация',icon:'⚡',focus:'Максимум темпа',note:'Используй всю ширину трассы, подготавливай шины и атакуй поздний апекс.'},
    {id:'race',name:'Гонка',icon:'🏁',focus:'Стабильность',note:'Оставляй запас на грязный воздух, износ и борьбу колесо в колесо.'},
    {id:'wet',name:'Дождь',icon:'◉',focus:'Сцепление',note:'Тормози раньше, избегай глянцевой траектории и распрямляй машину до газа.'},
    {id:'defence',name:'Защита',icon:'◆',focus:'Позиция',note:'Закрывай внутреннюю линию заранее и приоритетно готовь выход.'}
  ];
  const speedByGear = {1:72,2:96,3:126,4:158,5:196,6:232,7:270};
  guides.forEach((g,guideIndex)=>{
    g.photo=localGuidePhotos[g.track]||g.photo;
    g.modes=trainingModes;
    g.checklist=[
      'Пять чистых кругов подряд',
      'Стабильная точка торможения',
      'Ранний взгляд на выход',
      'Без лишних коррекций рулём',
      'Разброс серии меньше 0,7 секунды'
    ];
    g.sectors=g.sectors.map((sector,index)=>{
      const gearMatch=String(sector.gear).match(/(\d)/g)||['3'];
      const gear=Number(gearMatch[gearMatch.length-1])||3;
      const entry=Math.max(55,(speedByGear[gear]||126)-index*3);
      return {...sector,
        braking:index===0?'150–120 м':index===g.sectors.length-1?'120–80 м':`${Math.max(55,130-index*12)}–${Math.max(35,95-index*9)} м`,
        entrySpeed:`≈ ${entry} км/ч`,
        apex:index%3===0?'Поздний':index%3===1?'Нейтральный':'Двойной / прогрессивный',
        throttle:index%2===0?'Открывай после стабилизации руля':'Плавно добавляй с середины дуги',
        curb:index%3===0?'Умеренно, без удара днищем':index%3===1?'Можно использовать на выходе':'Избегай высокого внутреннего',
        telemetry:{brake:Math.max(22,82-index*9),throttle:Math.min(92,38+index*12),steering:Math.max(28,76-index*7)}
      };
    });
    const first=g.sectors[0],second=g.sectors[1]||first;
    g.quiz=[
      {q:`Какая передача указана для зоны «${first.name}»?`,options:[first.gear,'4–5','6–7'],answer:0},
      {q:`Какой ориентир торможения рекомендуется для «${second.name}»?`,options:['После апекса',second.braking,'Только по ощущениям'],answer:1},
      {q:'Какой подход лучше для стабильной тренировки?',options:['Один максимальный круг','Серии по 5 чистых кругов','Постоянная смена машины'],answer:1},
      {q:'Какая ошибка отмечена в этом гайде?',options:[g.mistakes[0],'Всегда ранний газ','Слишком низкое давление на старте'],answer:0},
      {q:'Какой параметр сетапа особенно важен?',options:['Случайный выбор давления',g.setup[0],'Максимально жёсткая подвеска'],answer:1}
    ];
  });

  const setupLibrarySeeds = [
    ['ACC · Spa Stable','acc','spa','m4gt3','dry',24,'Race','Стабильная задняя ось и предсказуемый выход из быстрых дуг.'],
    ['ACC · Spa Qualifying','acc','spa','296gt3','dry',21,'Quali','Острый передок и короткий топливный стинт для атаки.'],
    ['ACC · Monza Low Drag','acc','monza','720gt3','dry',28,'Low drag','Минимум сопротивления и устойчивость на жёстком торможении.'],
    ['ACC · Monza Wet Safe','acc','monza','amggt3','wet',16,'Rain','Мягкая реакция, высокий TC и запас по клиренсу.'],
    ['ACC · Nürburgring Race','acc','nurburgring','911gt3r','dry',22,'Race','Нейтральный баланс для длинного стинта.'],
    ['ACC · Imola Kerbs','acc','imola','huracangt3','dry',25,'Kerbs','Податливая подвеска и контроль поребриков.'],
    ['iRacing · Watkins GTP','iracing','watkins','963','dry',27,'Endurance','Умеренный аэробаланс и ровная деградация.'],
    ['iRacing · Daytona GTP','iracing','daytona','bmwmhybrid','dry',30,'Endurance','Низкое сопротивление и стабильность в бэнкинге.'],
    ['iRacing · Sebring LMP2','iracing','sebring','lmp2','hot',34,'Bumpy','Мягче на кочках и безопаснее на торможении.'],
    ['iRacing · Laguna MX-5','iracing','laguna','mx5','dry',20,'Training','Простой учебный баланс без резкой избыточной поворачиваемости.'],
    ['F1 · Silverstone Quali','f1','silverstone','f124','dry',19,'Quali','Высокая скорость смены направления в Maggotts–Becketts.'],
    ['F1 · Suzuka Race','f1','suzuka','f124','dry',26,'Race','Ритм S Curves и стабильный зад на Spoon.'],
    ['F1 · Bahrain Hot','f1','bahrain','f124','hot',38,'Hot','Контроль перегрева задних шин и тяги.'],
    ['AC · Nordschleife Road','ac','nurburgring','roadcar','dry',18,'Road','Безопасная платформа для изучения неровностей и слепых зон.'],
    ['AC · Drift Technical','ac','drift','s15drift','dry',23,'Drift','Прогрессивный дифференциал и контролируемая перекладка.'],
    ['AC EVO · Barcelona GT','ace','barcelona','gt4cayman','dry',24,'Balanced','Понятный баланс для длинных среднескоростных дуг.'],
    ['LMU · Le Mans Hypercar','lmu','lemans','499p','dry',22,'Endurance','Низкое сопротивление и стабильность на торможении Mulsanne.'],
    ['rFactor 2 · Road Atlanta','rf2','roadatlanta','lmp2','dry',29,'Prototype','Контроль платформы на перепадах высот.'],
    ['AMS2 · Interlagos GT','ams2','interlagos','m4gt3','wet',18,'Mixed','Запас сцепления и плавный дифференциал для переменных условий.'],
    ['RaceRoom · Daytona TCR','raceroom','daytona','rs3tcr','dry',27,'TCR','Стабильный передний привод и контроль перегрева передних шин.']
  ];
  const setupLibrary = setupLibrarySeeds.map((seed,index)=>{
    const [name,game,track,car,weather,temp,style,description]=seed;
    const wet=weather==='wet'||weather==='mixed';
    return {id:`library-${index+1}`,library:true,name,game,track,car,weather,temperature:temp,style,description,
      tags:[style,weather==='wet'?'Rain':weather==='hot'?'Hot':'Dry'],rating:Number((4.2+(index%7)*0.1).toFixed(1)),downloads:180+index*37,
      values:{frontPressure:wet?25.8:26.6+(index%3)*.1,rearPressure:wet?25.9:26.7+(index%2)*.1,frontWing:4+(index%5),rearWing:7+(index%6),frontARB:3+(index%5),rearARB:2+(index%4),frontRide:54+(index%8),rearRide:66+(index%9),brakeBias:52.5+(index%6)*.5,tc:wet?7:2+(index%5),abs:wet?6:2+(index%4),fuel:style==='Quali'?18:style==='Endurance'?95:55,camberFront:-3.2+(index%3)*.1,camberRear:-2.8+(index%3)*.1,toeFront:0.02+(index%3)*.01,toeRear:0.12+(index%4)*.02,diffPower:45+(index%5)*5,diffCoast:35+(index%4)*5,springFront:140000+index*2500,springRear:128000+index*2200}
    };
  });

  const profiles = [
    {id:'sprint', name:'Sprint', icon:'S', hint:'GT / Formula', goalLaps:35, goalSessions:4, focus:'Темп'},
    {id:'endurance', name:'Endurance', icon:'E', hint:'Long run / Multiclass', goalLaps:120, goalSessions:3, focus:'Стабильность'},
    {id:'formula', name:'Formula', icon:'F', hint:'Open wheel', goalLaps:60, goalSessions:4, focus:'Точность'},
    {id:'drift', name:'Drift', icon:'D', hint:'Angle / Style', goalLaps:45, goalSessions:4, focus:'Контроль'}
  ];

  const themes = [
    {id:'telemetry', name:'Telemetry Black', preview:'#0b0e14', accent:'#ff3b30'},
    {id:'carbon', name:'Carbon Red', preview:'#080808', accent:'#ff1f3d'},
    {id:'titanium', name:'Titanium', preview:'#20242b', accent:'#d6d9df'},
    {id:'papaya', name:'Papaya Grid', preview:'#111114', accent:'#ff8700'},
    {id:'electric', name:'Electric Blue', preview:'#07121c', accent:'#27a7ff'},
    {id:'violet', name:'Night Violet', preview:'#100b1e', accent:'#9b7bff'},
    {id:'ice', name:'Ice Light', preview:'#eef2f6', accent:'#0969da'},
    {id:'lcd', name:'Classic LCD', preview:'#0b120b', accent:'#98ff75'}
  ];

  const sampleSessions = [
    {id:'demo-1', profileId:'sprint', date:'2026-07-12', game:'acc', track:'spa', config:'Grand Prix', car:'m4gt3', weather:'Сухо · 24°C', sessionType:'Гонка', bestLap:'2:18.642', averageLap:'2:20.114', laps:18, cleanLaps:15, consistency:91.4, fuelStart:55, fuelEnd:8.7, tyreWear:23, notes:'Стабильный второй стинт. Можно снизить TC на выходе из La Source.', setupId:'setup-1', lapTimes:['2:21.004','2:20.218','2:19.774','2:19.220','2:18.642','2:19.101','2:20.053','2:19.447','2:20.008','2:19.765','2:20.215','2:20.489','2:20.691','2:21.203','2:20.840','2:20.411','2:20.737','2:21.031']},
    {id:'demo-4', profileId:'sprint', date:'2026-07-05', game:'acc', track:'spa', config:'Grand Prix', car:'m4gt3', weather:'Сухо · 29°C', sessionType:'Практика', bestLap:'2:21.284', averageLap:'2:23.047', laps:16, cleanLaps:12, consistency:88.9, fuelStart:42, fuelEnd:6.3, tyreWear:27, notes:'Базовая сессия для сравнения прогресса. Потеря времени в Pouhon и на выходе из Bus Stop.', setupId:'setup-1', lapTimes:['2:25.101','2:24.220','2:23.774','2:23.188','2:22.704','2:22.366','2:21.922','2:21.284','2:22.003','2:22.247','2:22.664','2:23.019','2:23.441','2:23.733','2:24.018','2:24.487']},
    {id:'demo-2', profileId:'formula', date:'2026-07-10', game:'f1', track:'silverstone', config:'Grand Prix', car:'f124', weather:'Переменно · 19°C', sessionType:'Квалификация', bestLap:'1:27.902', averageLap:'1:29.166', laps:11, cleanLaps:8, consistency:87.8, fuelStart:15, fuelEnd:3.2, tyreWear:18, notes:'Теряется время в Village и на выходе из Luffield.', setupId:'setup-2', lapTimes:['1:31.401','1:29.904','1:28.774','1:28.315','1:27.902','1:29.030','1:28.641','1:28.110','1:30.559','1:29.247','1:29.945']},
    {id:'demo-3', profileId:'endurance', date:'2026-07-07', game:'iracing', track:'watkins', config:'Boot', car:'963', weather:'Сухо · 28°C', sessionType:'Практика', bestLap:'1:33.480', averageLap:'1:35.012', laps:27, cleanLaps:24, consistency:93.1, fuelStart:70, fuelEnd:11.5, tyreWear:31, notes:'Хорошая деградация. Проверить передний ARB на длинном стинте.', setupId:'setup-3', lapTimes:['1:36.904','1:35.889','1:35.201','1:34.776','1:34.102','1:33.882','1:33.480','1:34.056','1:34.233','1:34.510','1:34.941','1:35.017','1:35.206','1:35.331','1:35.402','1:35.566','1:35.677','1:35.804','1:35.991','1:36.108','1:36.301','1:36.488','1:36.720','1:36.911','1:37.104','1:37.277','1:37.501']}
  ];

  const sampleSetups = [
    {id:'setup-1', name:'Spa Race Stable', profileId:'sprint', game:'acc', track:'spa', car:'m4gt3', created:'2026-07-12', tags:['Race','Stable'], values:{frontPressure:26.7,rearPressure:26.8,frontWing:5,rearWing:8,frontARB:4,rearARB:2,frontRide:56,rearRide:68,brakeBias:54.8,tc:4,abs:3,fuel:55,springFront:145000,springRear:132000}},
    {id:'setup-4', name:'Spa Quali Sharp', profileId:'sprint', game:'acc', track:'spa', car:'m4gt3', created:'2026-07-09', tags:['Quali','Rotation'], values:{frontPressure:26.6,rearPressure:26.7,frontWing:4,rearWing:7,frontARB:5,rearARB:3,frontRide:55,rearRide:67,brakeBias:54.2,tc:3,abs:3,fuel:18,springFront:150000,springRear:136000}},
    {id:'setup-2', name:'Silverstone Quali', profileId:'formula', game:'f1', track:'silverstone', car:'f124', created:'2026-07-10', tags:['Quali','Rotation'], values:{frontPressure:23.0,rearPressure:21.0,frontWing:34,rearWing:28,frontARB:8,rearARB:5,frontRide:24,rearRide:54,brakeBias:55,tc:0,abs:0,fuel:15,springFront:38,springRear:12}},
    {id:'setup-3', name:'Watkins Long Run', profileId:'endurance', game:'iracing', track:'watkins', car:'963', created:'2026-07-07', tags:['Endurance','Safe'], values:{frontPressure:24.5,rearPressure:24.7,frontWing:7,rearWing:10,frontARB:5,rearARB:3,frontRide:42,rearRide:58,brakeBias:52.6,tc:3,abs:2,fuel:70,springFront:180000,springRear:165000}}
  ];

  window.SIMGRID_DATA = {games, tracks, cars, guides, setupLibrary, profiles, themes, sampleSessions, sampleSetups};
})();
