"""Builds seed.json for the Cranellz story archive.

Facts (titles, order, versions, regions, featured characters) come from Game8's
Wuthering Waves quest and version pages, checked 2026-11-03. Synopses and
summaries are original Cranellz write-ups in English and Indonesian; they are
not game script text.
"""
import json
import re

G8 = "https://game8.co/games/Wuthering-Waves/archives/"

VERSIONS = {
    "1.0": ("Waking of a World", "2024-05-23"),
    "1.1": ("Thaw of Eons", "2024-06-28"),
    "1.2": ("In the Turquoise Moonglow", "2024-08-15"),
    "1.3": ("To the Shore's End", "2024-09-29"),
    "1.4": ("When the Night Knocks", "2024-11-14"),
    "2.0": ("All Silent Souls Can Sing", "2025-01-02"),
    "2.1": ("Waves Sing, and the Cerulean Bird Calls", "2025-02-13"),
    "2.2": ("Tangled Truths in the Inverted Tower", "2025-03-27"),
    "2.3": ("Fiery Arpeggio of Summer Reunion", "2025-04-29"),
    "2.4": ("Lightly We Toss the Crown", "2025-06-12"),
    "2.5": ("Unfading Melody of Life", "2025-07-24"),
    "2.6": ("By Sun's Scourge, By Moon's Revelation", "2025-08-28"),
    "2.7": ("Dawn Breaks on Dark Tides", "2025-10-09"),
    "2.8": ("To the City Set in Amber", "2025-11-20"),
    "3.0": ("We Who See the Stars", "2025-12-25"),
    "3.1": ("For You Who Walk in Snow", "2026-02-05"),
    "3.2": ("Resolution to Illuminate the Shadows", "2026-03-19"),
    "3.3": ("Reverbs From the End of Galaxies", "2026-04-30"),
    "3.4": ("The Dream Not Dreamed", "2026-06-08"),
    "3.5": ("Blade of Past Resounds, Lingering Dream Hymns", "2026-07-10"),
    "3.6": ("Lamplight in Mirage, Sword's Resolve in Heart", "2026-08-20"),
    "3.7": ("Prism's Illusion, Heart's Illumination", "2026-09-30"),
}

CATEGORIES = [
    {"code": "MAIN", "name": {"en": "Main Story", "id": "Cerita Utama"}, "name_jp": "メインストーリー", "sort": 1},
    {"code": "SEGUE", "name": {"en": "Segue", "id": "Selingan"}, "name_jp": "間奏", "sort": 2},
    {"code": "TALE", "name": {"en": "Tales", "id": "Kisah"}, "name_jp": "物語", "sort": 3},
    {"code": "COMP", "name": {"en": "Companion Story", "id": "Kisah Pendamping"}, "name_jp": "コンパニオン", "sort": 4},
    {"code": "SIDE", "name": {"en": "Side Quest", "id": "Misi Sampingan"}, "name_jp": "サイド", "sort": 5},
    {"code": "EXPL", "name": {"en": "Exploration Quest", "id": "Misi Eksplorasi"}, "name_jp": "探索", "sort": 6},
    {"code": "EVNT", "name": {"en": "Event Story", "id": "Cerita Event"}, "name_jp": "イベント", "sort": 7},
]

# Each row: (category, chapter_label, title_en, title_id, version, release_date or None,
#            region, characters, synopsis_en, synopsis_id, summary_en, summary_id, source_path, needs_review)
S = []

def add(cat, label, t_en, t_id, ver, region, chars, syn_en, syn_id, sum_en, sum_id, src, date=None, review=False, status="published"):
    S.append(dict(cat=cat, label=label, t_en=t_en, t_id=t_id, ver=ver, date=date or VERSIONS[ver][1],
                  region=region, chars=chars, syn_en=syn_en, syn_id=syn_id, sum_en=sum_en, sum_id=sum_id,
                  src=G8 + src if src else None, review=review, status=status))

# ---------------------------------------------------------------- Prologue + Chapter I (Huanglong, Black Shores)
add("MAIN", "PROLOGUE · ACT I", "Utterance of Marvels: I", "Ucapan Keajaiban: I", "1.0", "Huanglong", ["Rover", "Yangyang", "Chixia"],
    "The Rover wakes with no memory in a strange world, and a sudden battle reveals the power to absorb Echoes.",
    "Sang Rover terbangun tanpa ingatan di dunia yang asing, dan sebuah pertarungan mendadak menyingkap kekuatan untuk menyerap Echo.",
    "Strangers who seem to know the Rover greet them in a hazy wilderness. When a powerful enemy appears, the Rover discovers they can absorb the Echoes of defeated Tacet Discords, a gift that sets the whole journey in motion.",
    "Orang-orang asing yang seolah mengenal sang Rover menyambutnya di alam liar yang berkabut. Saat musuh kuat muncul, Rover mendapati dirinya mampu menyerap Echo dari Tacet Discord yang dikalahkan, anugerah yang memulai seluruh perjalanan.",
    "454537")
add("MAIN", "PROLOGUE · ACT II", "Utterance of Marvels: II", "Ucapan Keajaiban: II", "1.0", "Huanglong", ["Rover", "Yangyang", "Chixia"],
    "Leaving the Gorges of Spirits, the Rover learns to use Echoes and heads for Jinzhou, the heart of Huanglong.",
    "Meninggalkan Gorges of Spirits, Rover belajar menggunakan Echo dan menuju Jinzhou, jantung Huanglong.",
    "The Rover absorbs their first Echo from a fallen Tacet Discord and grows stronger with each fight. The road ends at the gates of Jinzhou, the bright capital of Huanglong.",
    "Rover menyerap Echo pertamanya dari Tacet Discord yang tumbang dan bertambah kuat di setiap pertarungan. Perjalanan berakhir di gerbang Jinzhou, ibu kota Huanglong yang gemerlap.",
    "454703")
add("MAIN", "CH. I · ACT I", "First Resonance", "Resonansi Pertama", "1.0", "Jinzhou", ["Rover", "Sanhua", "Jinhsi"],
    "Invited by Jinzhou's Magistrate, the Rover instead finds a trail of tokens hinting at where she has gone.",
    "Diundang oleh Magistrat Jinzhou, Rover justru menemukan jejak tanda yang mengisyaratkan ke mana ia pergi.",
    "The Rover arrives in Jinzhou expecting an audience with the Magistrate, but she is absent. In her place are tokens and riddles, the first steps of a search across Huanglong.",
    "Rover tiba di Jinzhou dan berharap bertemu sang Magistrat, tetapi ia tidak ada. Sebagai gantinya ada tanda dan teka-teki, langkah pertama sebuah pencarian di seluruh Huanglong.",
    "454733")
add("MAIN", "CH. I · ACT II", "Echoing Marche", "Mars yang Bergema", "1.0", "Huanglong", ["Rover", "Jiyan"],
    "The Magistrate's trail leads to the front line of Huanglong's war against the Tacet Discords.",
    "Jejak sang Magistrat mengarah ke garis depan perang Huanglong melawan Tacet Discord.",
    "Following the second token, the Rover reaches a region gripped by fear of the Tacet Discords. There a general leads the defence from the front, and the Rover joins the fight.",
    "Mengikuti tanda kedua, Rover tiba di wilayah yang dicekam ketakutan akan Tacet Discord. Di sana seorang jenderal memimpin pertahanan dari garis depan, dan Rover ikut bertempur.",
    "454745")
add("MAIN", "CH. I · ACT III", "Ominous Star", "Bintang Pertanda Buruk", "1.0", "Qichi Village", ["Rover", "Scar"],
    "Clues lead to the ruined Qichi Village, where the one who destroyed it is waiting.",
    "Petunjuk membawa Rover ke reruntuhan Desa Qichi, tempat sang penghancurnya menunggu.",
    "The next clue points to Qichi Village, a place emptied by tragedy. Among the ruins the Rover meets the figure responsible for its fall.",
    "Petunjuk berikutnya mengarah ke Desa Qichi, tempat yang dikosongkan oleh tragedi. Di antara reruntuhan, Rover bertemu sosok yang bertanggung jawab atas kehancurannya.",
    "455004")
add("MAIN", "CH. I · ACT IV", "Clashing Blades", "Benturan Pedang", "1.0", "Jinzhou", ["Rover", "Jinhsi", "Scar"],
    "In Jinzhou's hidden Grand Library the Rover finally meets the Magistrate, as an old enemy walks into a trap.",
    "Di Perpustakaan Agung Jinzhou yang tersembunyi, Rover akhirnya bertemu sang Magistrat, saat musuh lama masuk ke dalam perangkap.",
    "With every token solved, the Rover is led into the Grand Library for the long-awaited meeting. Just as answers come close, a familiar foe returns and the Magistrate's plan to seal him away springs shut.",
    "Setelah semua tanda terpecahkan, Rover dibawa ke Perpustakaan Agung untuk pertemuan yang lama dinanti. Tepat saat jawaban mendekat, musuh lama kembali dan rencana sang Magistrat untuk menyegelnya pun dijalankan.",
    "455883")
add("MAIN", "CH. I · ACT V", "Rewinding Raindrops", "Tetes Hujan yang Berbalik", "1.0", "Huanglong", ["Rover", "Jinhsi", "Yangyang"],
    "Rain falls upward as a Threnodian stirs, and the Rover sets out to find the elusive Black Shores.",
    "Hujan jatuh ke atas saat seekor Threnodian bergerak, dan Rover berangkat mencari Black Shores yang misterius.",
    "A message from the Sentinel sends the Rover looking for the Black Shores. Meanwhile Retrograde Rain climbs into the sky, a sign that a Threnodian is waking and that a catastrophe may follow.",
    "Pesan dari sang Sentinel membuat Rover mencari Black Shores. Sementara itu Hujan Retrograd naik ke langit, tanda bahwa seekor Threnodian terbangun dan bencana bisa menyusul.",
    "456178")
add("MAIN", "CH. I · ACT VI", "Grand Warstorm", "Badai Perang Besar", "1.0", "Huanglong", ["Rover", "Jinhsi", "Jiyan"],
    "Huanglong goes to war against a flood of Tacet Discords as the Rover faces the Threnodian, the Dreamless.",
    "Huanglong berperang melawan gelombang Tacet Discord saat Rover menghadapi sang Threnodian, Dreamless.",
    "Tacet Discords pour across Huanglong and the nation commits everything to its defence. At the centre of the storm the Rover confronts the Dreamless to stop the threat to the whole nation.",
    "Tacet Discord membanjiri Huanglong dan bangsa itu mengerahkan segalanya untuk bertahan. Di pusat badai, Rover menghadapi Dreamless untuk menghentikan ancaman bagi seluruh negeri.",
    "456226")
add("MAIN", "CH. I · ACT VII", "Thaw of Eons", "Mencairnya Zaman", "1.1", "Mt. Firmament", ["Rover", "Jinhsi", "Changli", "Abby"],
    "With the Sentinel missing, the Rover travels to Mt. Firmament, where time itself has stopped flowing normally.",
    "Dengan hilangnya sang Sentinel, Rover pergi ke Mt. Firmament, tempat waktu tak lagi mengalir semestinya.",
    "After the Threnodian falls, the Rover gains a new companion and follows dreams of Sentinel Jue to Mt. Firmament. Time there has warped, and freeing the captive Sentinel forces the Magistrate to defy destiny for her city.",
    "Setelah sang Threnodian tumbang, Rover mendapat pendamping baru dan mengikuti mimpi tentang Sentinel Jue ke Mt. Firmament. Waktu di sana telah menyimpang, dan membebaskan sang Sentinel yang terkurung memaksa sang Magistrat menentang takdir demi kotanya.",
    "459842")
add("MAIN", "CH. I · ACT VIII", "To the Shore's End", "Menuju Ujung Pantai", "1.3", "Black Shores", ["Rover", "Shorekeeper", "Yangyang", "Aalto"],
    "Fear of a new Lament brings the Rover to the Black Shores, where the truth of their origins is revealed.",
    "Kekhawatiran akan Lament baru membawa Rover ke Black Shores, tempat kebenaran tentang asal-usulnya terungkap.",
    "Phantoms of the last Lament resurface in the Port City of Guixu and the trail ends at the Black Shores. There the Shorekeeper reveals the Rover's past, and the Rover must enter the Tethys System to save her and stabilise it.",
    "Bayangan dari Lament terakhir muncul kembali di Kota Pelabuhan Guixu dan jejaknya berakhir di Black Shores. Di sana Shorekeeper mengungkap masa lalu Rover, dan Rover harus masuk ke Sistem Tethys untuk menyelamatkannya dan menstabilkan sistem itu.",
    "474398")

# ---------------------------------------------------------------- Chapter II (Rinascita)
add("MAIN", "CH. II · PROLOGUE", "Through the Sea Thou Break", "Menembus Lautan", "2.0", "Rinascita", ["Rover", "Abby"],
    "To save Abby's fading frequency, the Rover sails for Ragunna in search of Imperator, Sentinel of Rinascita.",
    "Demi menyelamatkan frekuensi Abby yang memudar, Rover berlayar ke Ragunna mencari Imperator, Sentinel Rinascita.",
    "Abby's frequency is weakening and only Rinascita's Sentinel may hold the cure. The Rover crosses uncharted waters toward Ragunna, where long-hidden answers wait.",
    "Frekuensi Abby melemah dan hanya Sentinel Rinascita yang mungkin punya penawarnya. Rover menyeberangi perairan yang belum terpetakan menuju Ragunna, tempat jawaban yang lama tersembunyi menunggu.",
    "492480")
add("MAIN", "CH. II · ACT I", "The Sacred Breeze So Often Breathes", "Angin Suci yang Selalu Berembus", "2.0", "Ragunna", ["Rover", "Carlotta"],
    "A friendly member of a great Rinascitan family guides the Rover through Ragunna, where something uncanny lurks.",
    "Anggota ramah dari keluarga besar Rinascita memandu Rover menjelajahi Ragunna, tempat sesuatu yang ganjil bersembunyi.",
    "The Rover is welcomed into Ragunna's lively streets by one of the city's leading families. Beneath the colour and music, signs appear that something is wrong with the city.",
    "Rover disambut di jalanan Ragunna yang ramai oleh salah satu keluarga terkemuka kota itu. Di balik warna dan musik, muncul tanda bahwa ada yang tidak beres dengan kota itu.",
    "492487")
add("MAIN", "CH. II · ACT II", "Veils Off in Sun or Shadow", "Tabir Tersingkap di Terang maupun Bayang", "2.0", "Ragunna", ["Rover", "Carlotta", "Roccia"],
    "Strange events follow a member of the Fisalia family, and the Rover joins an investigation to find out why.",
    "Peristiwa aneh mengikuti seorang anggota keluarga Fisalia, dan Rover ikut menyelidiki penyebabnya.",
    "The Montelli family and an Acolyte of the Order team up with the Rover to look into a Fisalia family member whose arrival brought strange occurrences to Ragunna.",
    "Keluarga Montelli dan seorang Akolit Ordo bekerja sama dengan Rover untuk menyelidiki anggota keluarga Fisalia yang kedatangannya membawa kejadian aneh ke Ragunna.",
    "492483")
add("MAIN", "CH. II · ACT III", "What Yesterday Wept, Today Doth Sing", "Yang Kemarin Menangis, Hari Ini Bernyanyi", "2.0", "Ragunna", ["Rover", "Roccia", "Brant", "Phoebe"],
    "The Fool's Troupe stages a forbidden Carnevale, until an old enemy crashes the celebration.",
    "Rombongan Fool's Troupe menggelar Carnevale terlarang, sampai seorang musuh lama mengacaukan perayaan itu.",
    "A meeting with the Fool's Troupe leads to a grand but forbidden Carnevale. The festival turns to chaos when a foe carrying lycoris flowers arrives.",
    "Pertemuan dengan Fool's Troupe berujung pada Carnevale yang megah namun terlarang. Festival berubah kacau saat musuh yang membawa bunga lycoris muncul.",
    "492529")
add("MAIN", "CH. II · ACT IV", "The Maiden, The Defier, The Death Crier", "Sang Gadis, Sang Penantang, Sang Penyeru Maut", "2.2", "Avinoleum", ["Rover", "Cartethyia", "Cantarella"],
    "Called to Porto-Veno Castle, the Rover enters the ruins of Avinoleum and meets a tormented divinity.",
    "Dipanggil ke Kastel Porto-Veno, Rover memasuki reruntuhan Avinoleum dan bertemu sosok ilahi yang tersiksa.",
    "The head of the Fisalia family invites the Rover to look for answers about the Sentinel Imperator. In the shifting towers of Avinoleum the Rover encounters the Martyred Maiden and her long search for absolution.",
    "Kepala keluarga Fisalia mengundang Rover mencari jawaban tentang Sentinel Imperator. Di menara-menara Avinoleum yang terus bergeser, Rover bertemu sang Gadis Martir dan pencariannya yang panjang akan penebusan.",
    "506710")
add("MAIN", "CH. II · ACT V", "Shadow of Glory", "Bayang-Bayang Kejayaan", "2.4", "Septimont", ["Rover", "Lupa", "Cartethyia"],
    "Searching for the Blessed Maiden leads the Rover to Septimont, where a great tournament hides an anomaly.",
    "Pencarian sang Gadis Terberkati membawa Rover ke Septimont, tempat sebuah turnamen besar menyembunyikan anomali.",
    "The Maiden cannot be found in the Inverted Tower, so the Rover follows her trace to proud Septimont. The city's glorious tournament seems to mask an anomaly that only the Rover can sense.",
    "Sang Gadis tidak ditemukan di Menara Terbalik, maka Rover mengikuti jejaknya ke Septimont yang angkuh. Turnamen gemilang kota itu seolah menutupi anomali yang hanya bisa dirasakan Rover.",
    "528736")
add("MAIN", "CH. II · ACT VI", "Flames of Heart", "Api di Dalam Hati", "2.4", "Septimont", ["Rover", "Lupa"],
    "As Septimont's anomaly unravels, the Rover and Lupa hunt the mastermind behind it.",
    "Saat anomali Septimont terungkap, Rover dan Lupa memburu dalang di baliknya.",
    "The Rover and the star gladiator Lupa follow the trail into a burial ground of heroes. Lupa's burning resolve proves she belongs at the centre of the city's story.",
    "Rover dan gladiator bintang Lupa mengikuti jejak hingga ke pemakaman para pahlawan. Tekad Lupa yang membara membuktikan bahwa ia layak menjadi pusat kisah kota itu.",
    "533154", date="2025-07-03")
add("MAIN", "CH. II · ACT VII", "Dreamcatchers in the Secret Gardens", "Penangkap Mimpi di Taman Rahasia", "2.5", "Rinascita", ["Rover", "Phrolova"],
    "A dreamer seals her heart away in a hidden realm of dreams built on melancholy music.",
    "Seorang pemimpi mengunci hatinya di dunia mimpi tersembunyi yang dibangun dari musik melankolis.",
    "The Rover follows a dreamer into a realm beyond ordinary sight, shaped by sorrowful melodies. She walks a fragile path between hope and delusion and refuses to look back.",
    "Rover mengikuti seorang pemimpi ke alam di luar pandangan biasa, yang dibentuk oleh melodi yang sendu. Ia menempuh jalan rapuh antara harapan dan khayalan dan menolak menoleh ke belakang.",
    "538764")
add("SEGUE", "CH. II · OVERTURE", "Overture: Rust, Sword, and the Sun", "Overtur: Karat, Pedang, dan Matahari", "2.6", "Septimont", ["Rover", "Abby", "Augusta"],
    "A mysterious figure retells the story of Augusta before she became Septimont's leader.",
    "Sosok misterius menceritakan kembali kisah Augusta sebelum ia menjadi pemimpin Septimont.",
    "While checking on Septimont after recent events, the Rover and Abby meet a stranger who wants to tell Augusta's story from before she rose to lead the nation.",
    "Saat memeriksa keadaan Septimont setelah peristiwa terakhir, Rover dan Abby bertemu orang asing yang ingin menceritakan kisah Augusta sebelum ia memimpin bangsanya.",
    "543756")
add("MAIN", "CH. II · ACT VIII", "By Sun's Burning Hand", "Oleh Tangan Matahari yang Membara", "2.6", "Sanguis Plateau", ["Rover", "Augusta", "Iuno"],
    "The Ephor Augusta invites the Rover to the Hunt on the Sanguis Plateau, where the Dark Tide never recedes.",
    "Sang Ephor Augusta mengundang Rover ke Perburuan di Dataran Sanguis, tempat Pasang Gelap tak pernah surut.",
    "On the ominous plateau the Rover joins Septimont's Hunt against the Dark Tide. The journey uncovers a prophecy that binds the Ephor to the Priestess Iuno.",
    "Di dataran yang muram itu, Rover ikut dalam Perburuan Septimont melawan Pasang Gelap. Perjalanan ini menyingkap sebuah ramalan yang mengikat sang Ephor dengan Pendeta Iuno.",
    "545730")
add("MAIN", "CH. II · ACT IX", "By Moon's Fated Light", "Oleh Cahaya Bulan yang Ditakdirkan", "2.6", "Sanguis Plateau", ["Rover", "Iuno", "Augusta"],
    "The Dark Tide retreats, but the Priestess Iuno vanishes from the world and from everyone's memory.",
    "Pasang Gelap mundur, tetapi Pendeta Iuno lenyap dari dunia dan dari ingatan semua orang.",
    "Septimont celebrates pushing back the Dark Tide, yet Iuno is gone and almost no one remembers her. The Rover investigates her disappearance and tries to pull her back from Chaos.",
    "Septimont merayakan keberhasilan memukul mundur Pasang Gelap, namun Iuno hilang dan hampir tak ada yang mengingatnya. Rover menyelidiki hilangnya dia dan berusaha menariknya kembali dari Kekacauan.",
    "545731")
add("MAIN", "CH. II · ACT X", "The Bygone Shall Always Return", "Yang Telah Berlalu Akan Selalu Kembali", "2.7", "Rinascita", ["Rover", "Galbrena", "Iuno"],
    "A winged figure who seems to command Tacet Discords challenges the Rover: who is Galbrena?",
    "Sosok bersayap api yang seolah memerintah Tacet Discord menantang Rover: siapakah Galbrena?",
    "With Iuno rescued, a new mystery appears in the form of Galbrena, who flies on wings of fire. The Rover sets out to learn who she is and what she wants.",
    "Setelah Iuno diselamatkan, misteri baru muncul dalam wujud Galbrena yang terbang dengan sayap api. Rover berangkat untuk mengetahui siapa dia dan apa tujuannya.",
    "555987")
add("MAIN", "CH. II · ACT XI", "Dawn Breaks on Dark Tides", "Fajar Menyingsing di Atas Pasang Gelap", "2.7", "Rinascita", ["Rover", "Cartethyia", "Augusta", "Galbrena"],
    "All of Rinascita hangs in the balance as the Threnodian Leviathan prepares to return.",
    "Seluruh Rinascita dipertaruhkan saat Threnodian Leviathan bersiap untuk kembali.",
    "Every thread of the chapter leads here. The Rover and their allies stand against the returning Leviathan in the final battle for Rinascita.",
    "Setiap benang kisah bab ini bermuara di sini. Rover dan sekutunya menghadapi Leviathan yang kembali dalam pertempuran terakhir demi Rinascita.",
    "556087")
add("SEGUE", "CH. II · AFTERSTORY", "Stranger in a Strange Land", "Orang Asing di Negeri Asing", "2.7", "Rinascita", ["Qiuyuan"],
    "The blind swordsman Qiuyuan retells recent events in Rinascita from his own point of view.",
    "Pendekar pedang buta Qiuyuan menceritakan kembali peristiwa terbaru di Rinascita dari sudut pandangnya.",
    "With the Rinascita chapter closed, the story steps aside to follow Qiuyuan. His path through the same events reveals new stories and secrets.",
    "Setelah bab Rinascita ditutup, cerita beralih mengikuti Qiuyuan. Perjalanannya melalui peristiwa yang sama menyingkap kisah dan rahasia baru.",
    "556238")
add("MAIN", "CH. II · ACT XII", "Stagnant Dawn on Wastelands", "Fajar yang Terhenti di Tanah Gersang", "2.8", "Honami City", ["Rover", "Chisa"],
    "Shifting coordinates from the Threnodian's Gem lead the Rover to a metropolis that was erased long ago.",
    "Koordinat yang terus bergeser dari Permata Threnodian membawa Rover ke sebuah metropolis yang telah lama terhapus.",
    "While the Black Shores study the Leviathan's Gem, a pair of drifting coordinates points somewhere unknown. Following them, the Rover arrives in a city that should no longer exist.",
    "Saat Black Shores meneliti Permata sang Leviathan, sepasang koordinat yang terus bergeser menunjuk ke tempat tak dikenal. Mengikutinya, Rover tiba di sebuah kota yang seharusnya sudah tidak ada.",
    "564916")
add("SEGUE", "CH. II · SEGUE", "Flowing Starlight in the Iris", "Cahaya Bintang yang Mengalir di Iris", "2.8", "Black Shores", ["Rover", "Chisa"],
    "After escaping Honami City, the Rover visits Chisa as she recovers at the Black Shores.",
    "Setelah lolos dari Kota Honami, Rover menjenguk Chisa yang sedang pulih di Black Shores.",
    "Chisa pushed herself to the edge of overclocking more than once during the escape. Now she is being treated at the Black Shores, and the reunion becomes a new beginning for both of them.",
    "Chisa berkali-kali memaksa dirinya hingga ambang overclocking selama pelarian. Kini ia dirawat di Black Shores, dan pertemuan kembali itu menjadi awal baru bagi keduanya.",
    "564931")

# ---------------------------------------------------------------- Chapter III (Lahai-Roi)
add("MAIN", "CH. III · PROLOGUE", "When the Unknown Thrums", "Saat yang Tak Dikenal Berdengung", "3.0", "Lahai-Roi", ["Rover", "Chisa"],
    "Through a stabilised portal, the Rover and Chisa arrive at Startorch Academy and straight into a Voidstorm.",
    "Melalui portal yang telah stabil, Rover dan Chisa tiba di Akademi Startorch dan langsung menghadapi Voidstorm.",
    "The Rover and Chisa head to Startorch Academy in Lahai-Roi. On arrival they face another attempt to steal the Rover's frequency and a Voidstorm sweeping over the campus.",
    "Rover dan Chisa menuju Akademi Startorch di Lahai-Roi. Begitu tiba, mereka menghadapi upaya lain untuk mencuri frekuensi Rover dan Voidstorm yang menyapu kampus.",
    "571778")
add("MAIN", "CH. III · ACT I", "What Burns Beneath Frostlands", "Yang Membara di Bawah Tanah Beku", "3.0", "Lahai-Roi", ["Rover", "Lynae"],
    "Lynae welcomes the new student to Startorch Academy with a campus tour that hides its own agenda.",
    "Lynae menyambut murid baru di Akademi Startorch dengan tur kampus yang menyimpan agenda tersendiri.",
    "After rescuing the Rover from a Voidworm attack, Lynae offers an impromptu tour of Lahai-Roi. Her friendly welcome comes with a purpose she has not yet revealed.",
    "Setelah menyelamatkan Rover dari serangan Voidworm, Lynae menawarkan tur dadakan keliling Lahai-Roi. Sambutan hangatnya membawa tujuan yang belum ia ungkapkan.",
    "571785")
add("MAIN", "CH. III · ACT II", "Ode to the Second Sunrise", "Pujian bagi Matahari Terbit Kedua", "3.0", "Lahai-Roi", ["Rover", "Mornye"],
    "The Rover and Professor Mornye race to stop Lahai-Roi's artificial sun from crashing into the underground.",
    "Rover dan Profesor Mornye berpacu mencegah matahari buatan Lahai-Roi jatuh ke dunia bawah tanah.",
    "Outside Fractsidus agents plan to disrupt the New Solar Ceremony. The Rover teams up with Professor Mornye to keep the artificial sun in the sky.",
    "Agen Fractsidus dari luar berencana mengacaukan Upacara Surya Baru. Rover bekerja sama dengan Profesor Mornye agar matahari buatan tetap di langit.",
    "571796")
add("MAIN", "CH. III · ACT III", "The Star That Voyages Far", "Bintang yang Berlayar Jauh", "3.1", "Frostlands Surface", ["Rover", "Aemeath", "Luuk Herssen"],
    "The Rover meets Aemeath and, with Luuk Herssen, discovers an orbital station holding truths about Solaris-3's future.",
    "Rover bertemu Aemeath dan bersama Luuk Herssen menemukan stasiun orbit yang menyimpan kebenaran tentang masa depan Solaris-3.",
    "Aemeath's unusual circumstances draw the Rover into a journey to the Frostlands Surface with Luuk Herssen. An orbital space station reveals major findings about Solaris-3, the Rover's origins and Aemeath's true goal with the Exostrider.",
    "Keadaan Aemeath yang tidak biasa menarik Rover ke dalam perjalanan menuju Permukaan Frostlands bersama Luuk Herssen. Sebuah stasiun luar angkasa di orbit mengungkap temuan besar tentang Solaris-3, asal-usul Rover, dan tujuan sejati Aemeath dengan Exostrider.",
    "578306")
add("SEGUE", "CH. III · SEGUE", "All That Sunlight Touches", "Segala yang Disentuh Cahaya Matahari", "3.1", "Roya Frostlands", ["Rover", "Luuk Herssen"],
    "The Rover and Luuk Herssen regroup, then return to the orbital station when Nivora is taken there.",
    "Rover dan Luuk Herssen menyusun ulang strategi, lalu kembali ke stasiun orbit saat Nivora dibawa ke sana.",
    "After a painful turn of events in Roya Frostlands, the two plan their next move. A kidnapping forces them back to the orbital space station.",
    "Setelah rangkaian peristiwa yang menyakitkan di Roya Frostlands, keduanya merencanakan langkah berikutnya. Sebuah penculikan memaksa mereka kembali ke stasiun luar angkasa di orbit.",
    "578309")
add("MAIN", "CH. III · ACT IV", "Gold Suspended in the Shadows", "Emas yang Menggantung di Dalam Bayang", "3.2", "Startorch Academy", ["Rover", "Sigrika"],
    "Hunting an infiltrator inside the academy, the Rover is drawn into quests with Sigrika, heir of the Heliodic Six.",
    "Saat memburu penyusup di dalam akademi, Rover terlibat dalam misi bersama Sigrika, penerus Heliodic Six.",
    "The Rover searches Startorch Academy for a possible infiltrator. Along the way they become caught up in a series of tasks with Sigrika, successor to Roya's Heliodic Six, during the New Solar Celebration.",
    "Rover mencari kemungkinan penyusup di Akademi Startorch. Di tengah jalan, mereka terlibat serangkaian tugas bersama Sigrika, penerus Heliodic Six dari Roya, selama Perayaan Surya Baru.",
    "586746")
add("SEGUE", "CH. III · SEGUE", "Rabbit Reflected in Shades", "Kelinci yang Terpantul dalam Bayangan", "3.2", "Startorch Academy", ["Rover", "Lucilla"],
    "The Rover and President Lucilla confront the academy's Dark Side before it threatens the whole region.",
    "Rover dan Presiden Lucilla menghadapi Sisi Gelap akademi sebelum mengancam seluruh wilayah.",
    "Startorch Academy's Dark Side has become a real danger to Lahai-Roi's stability. Lucilla and the Rover work together to resolve it.",
    "Sisi Gelap Akademi Startorch telah menjadi bahaya nyata bagi kestabilan Lahai-Roi. Lucilla dan Rover bekerja sama untuk mengatasinya.",
    "586761")
add("SEGUE", "CH. III · SEGUE", "Wishes in the Bell", "Harapan di Dalam Lonceng", "3.3", "Lahai-Roi", ["Hiyuki"],
    "Spacetrek Collective operative Hiyuki investigates the Voidstorm threat over Lahai-Roi.",
    "Hiyuki, operatif Spacetrek Collective, menyelidiki ancaman Voidstorm di atas Lahai-Roi.",
    "This segue follows Hiyuki of the Special Response Force as she looks into the Voidstorms that keep striking Lahai-Roi.",
    "Selingan ini mengikuti Hiyuki dari Pasukan Tanggap Khusus saat ia menyelidiki Voidstorm yang terus melanda Lahai-Roi.",
    "596749")
add("MAIN", "CH. III · ACT V", "Starlights from Yesterdays", "Cahaya Bintang dari Hari-Hari Kemarin", "3.3", "Lahai-Roi", ["Rover", "Aemeath", "Lynae", "Luuk Herssen"],
    "Solaris faces Aleph-1 across space and time to save Aemeath and break the world's devastating loop.",
    "Solaris menghadapi Aleph-1 melintasi ruang dan waktu demi menyelamatkan Aemeath dan memutus siklus yang menghancurkan dunia.",
    "Prepared for the world-ending threat of Aleph-1, the Rover and their allies fight the Threnodian across space and time. Their goal is to save Aemeath and the Exostrider and end the loop the world is trapped in.",
    "Siap menghadapi ancaman kiamat Aleph-1, Rover dan sekutunya melawan sang Threnodian melintasi ruang dan waktu. Tujuan mereka adalah menyelamatkan Aemeath dan Exostrider serta mengakhiri siklus yang menjerat dunia.",
    "597003")
add("SEGUE", "CH. III · SEGUE", "Beneath a Melting Night Sky", "Di Bawah Langit Malam yang Mencair", "3.3", "Lahai-Roi", ["Rover", "Denia"],
    "After victory over Aleph-1, the Rover looks for the Artificial Resonator Denia and her origins.",
    "Setelah kemenangan atas Aleph-1, Rover mencari Resonator Buatan Denia dan asal-usulnya.",
    "With the Fractsidus and Aleph-1 defeated, the Rover tracks down Denia to learn where she came from and what she is facing now.",
    "Setelah Fractsidus dan Aleph-1 dikalahkan, Rover melacak Denia untuk mengetahui asal-usulnya dan apa yang sedang ia hadapi.",
    "597023")
add("EVNT", "CH. III · SIDE STORY", "At Dream's Edge", "Di Tepi Mimpi", "3.4", "Lahai-Roi", ["Rover"],
    "A collaboration side story in which the Rover faces an otherworldly enemy alongside otherworldly friends.",
    "Cerita sampingan kolaborasi saat Rover menghadapi musuh dari dunia lain bersama kawan-kawan dari dunia lain.",
    "Part of the Cyberpunk: Edgerunners collaboration and separate from the main plot. The Rover meets an unlikely enemy from another world and unexpected allies who are ready to help.",
    "Bagian dari kolaborasi Cyberpunk: Edgerunners dan terpisah dari alur utama. Rover bertemu musuh tak terduga dari dunia lain dan sekutu tak terduga yang siap membantu.",
    "603079")
add("SEGUE", "CH. III · SEGUE", "We Choose the Sky", "Kami Memilih Langit", "3.4", "Startorch Academy", ["Lucilla", "Rover"],
    "Lucilla takes centre stage again as she weighs the future threats facing Startorch Academy and Lahai-Roi.",
    "Lucilla kembali menjadi sorotan saat ia menimbang ancaman masa depan bagi Akademi Startorch dan Lahai-Roi.",
    "After the Fractsidus attack and the banishing of Aleph-1, Lucilla turns to what comes next for the academy and for Lahai-Roi.",
    "Setelah serangan Fractsidus dan terusirnya Aleph-1, Lucilla memikirkan apa yang akan datang bagi akademi dan Lahai-Roi.",
    "603081")

# ---------------------------------------------------------------- Chapter IV (Huanglong: Mengzhou, Xuanfang)
add("MAIN", "CH. IV · ACT I", "The Wind Before the Storm", "Angin Sebelum Badai", "3.5", "Mengzhou", ["Rover", "Suisui", "Yangyang"],
    "Back in Huanglong, the Rover learns Yangyang is missing in Xuanfang and joins her sister Suisui to find her.",
    "Kembali ke Huanglong, Rover mengetahui Yangyang hilang di Xuanfang dan bergabung dengan adiknya, Suisui, untuk mencarinya.",
    "With Lahai-Roi safe, the Rover returns to Huanglong to look into their origins and the next Threnodian threat. On the way they hear that an expedition into Xuanfang went wrong and Yangyang has vanished.",
    "Setelah Lahai-Roi aman, Rover kembali ke Huanglong untuk menelusuri asal-usulnya dan ancaman Threnodian berikutnya. Di perjalanan, mereka mendengar ekspedisi ke Xuanfang gagal dan Yangyang menghilang.",
    "606975")
add("MAIN", "CH. IV · ACT II", "Xuanling Sings, Storm Quelled", "Xuanling Bernyanyi, Badai Mereda", "3.5", "Xuanfang Hold", ["Rover", "Suisui", "Yangyang"],
    "Rogue Autopuppets riot through Xuanfang, and an artisan chasing Sentinel technology launches a full assault.",
    "Autopuppet liar mengamuk di Xuanfang, dan seorang artisan yang memburu teknologi Sentinel melancarkan serangan besar.",
    "The Rover and Suisui find that a troubled artisan is behind the rogue Autopuppets. When the artisan turns them on Xuanfang Hold, the Rover and their allies must defend it.",
    "Rover dan Suisui menemukan bahwa seorang artisan yang bermasalah berada di balik Autopuppet liar. Saat ia mengarahkan mereka ke Benteng Xuanfang, Rover dan sekutunya harus mempertahankannya.",
    "606977")
add("SEGUE", "CH. IV · SEGUE", "The Chant of Unseen Tides", "Kidung Pasang yang Tak Terlihat", "3.5", "Xuanfang Hold", ["Yangyang"],
    "Helping Xuanfang recover, Yangyang begins to hear whispering voices inside her head.",
    "Saat membantu Xuanfang pulih, Yangyang mulai mendengar suara-suara berbisik di dalam kepalanya.",
    "Yangyang stays to help citizens affected by the attack while waiting for her Resonance Report. Murmuring voices follow her, and she sets out to find their source.",
    "Yangyang tetap tinggal untuk membantu warga yang terdampak serangan sambil menunggu Laporan Resonansinya. Suara-suara bergumam mengikutinya, dan ia berusaha menemukan sumbernya.",
    "606978")
add("MAIN", "CH. IV · ACT III", "Song of the Heart Sword", "Lagu Pedang Hati", "3.6", "Xuanfang Hold", ["Rover", "Qingxiao", "Jingran", "Yangyang"],
    "Searching for Hsin with Qingxiao, the Rover is pulled into a war among cloud shuttles above Xuanfang.",
    "Mencari Hsin bersama Qingxiao, Rover terseret ke dalam perang di antara kapal awan di atas Xuanfang.",
    "Xianling Village comes under attack and a strange coin pendant opens a path into the Manifold Sanctum. The Rover and the sword master Qingxiao cross fleets of Cloud Shuttles, face her past, and stand against Muyu.",
    "Desa Xianling diserang dan sebuah liontin koin aneh membuka jalan ke Manifold Sanctum. Rover dan ahli pedang Qingxiao menyeberangi armada Kapal Awan, menghadapi masa lalunya, dan melawan Muyu.",
    "614751")
add("SEGUE", "CH. IV · SEGUE", "The Nethermancer's Requiem", "Requiem Sang Nethermancer", "3.6", "Xuanfang Hold", ["Jingran"],
    "A segue centred on Jingran, the Nethermancer, set after the battle above Xuanfang.",
    "Selingan yang berpusat pada Jingran, sang Nethermancer, setelah pertempuran di atas Xuanfang.",
    "This segue continues the story of Jingran after the events of Song of the Heart Sword and leads into Act IV.",
    "Selingan ini melanjutkan kisah Jingran setelah peristiwa Lagu Pedang Hati dan mengantar ke Babak IV.",
    "614756", review=True)
add("MAIN", "CH. IV · ACT IV", "Simulacrum of the Heart", "Simulakrum Hati", "3.7", "Mengzhou", ["Rover", "Hsin", "Suoming", "Qingxiao"],
    "Rumours say Xuanfang Hold is near collapse, and the Rover enters Hsin's Heart Realm to find the fading Moon Fox.",
    "Kabar beredar bahwa Benteng Xuanfang hampir runtuh, dan Rover memasuki Alam Hati Hsin untuk menemukan Rubah Bulan yang memudar.",
    "Qingxiao fears Hsin's presence is weakening, so the Rover follows Intendant Suoming into the Manifold Sanctum. In the Simulacrum Nexus and Hsin's memories they uncover what happened to the Moon Fox before the Waking Moon Festival.",
    "Qingxiao khawatir kehadiran Hsin melemah, maka Rover mengikuti Intendan Suoming ke Manifold Sanctum. Di Simulacrum Nexus dan ingatan Hsin, mereka mengungkap apa yang terjadi pada sang Rubah Bulan sebelum Festival Bulan Terjaga.",
    "624354")
add("TALE", "CH. IV · TALES", "Moonlike Heart, Mortal Longing", "Hati Laksana Bulan, Kerinduan Fana", "3.7", "Mengxuan Vale", ["Rover", "Hsin"],
    "The first Tales quest: Xuanqing asks the Rover to help repair a Feeling Capsule meant for Hsin.",
    "Misi Tales pertama: Xuanqing meminta Rover membantu memperbaiki Kapsul Perasaan yang ditujukan untuk Hsin.",
    "A message from a stranger introduces Xuanqing and her Myriad Snare, Tuntun. Restoring the broken Feeling Capsule takes the Rover through the Heart of Ruin and Xuanqing's own memories, ending with a gift delivered to Hsin.",
    "Pesan dari orang asing memperkenalkan Xuanqing dan Myriad Snare miliknya, Tuntun. Memulihkan Kapsul Perasaan yang rusak membawa Rover melewati Heart of Ruin dan ingatan Xuanqing sendiri, diakhiri dengan hadiah yang diserahkan kepada Hsin.",
    "624714")

# ---------------------------------------------------------------- Companion stories
COMP = [
    ("Yinlin", "Solitary Path", "Jalan Sunyi", "1.0", "Jinzhou", "456288"),
    ("Jiyan", "Boat Race in River", "Lomba Perahu di Sungai", "1.0", "Jinzhou", "456603"),
    ("Jiyan", "Replica of Past Days", "Replika Hari-Hari Lalu", "1.0", "Huanglong", "456615"),
    ("Jiyan", "Pastures Like Old Times", "Padang Rumput Seperti Dulu", "1.0", "Jinzhou", "456632"),
    ("Lingyang", "Wild Heart's Return", "Kembalinya Hati yang Liar", "1.0", "Jinzhou", "455856"),
    ("Changli", "Immortal Blaze", "Kobaran Abadi", "1.1", "Mt. Firmament", "458277"),
    ("Zhezhi", "True Colors", "Warna Sejati", "1.2", "Jinzhou", "464360"),
    ("Encore", "Small Wooly, Big Adventures", "Si Wol Kecil, Petualangan Besar", "1.3", "Jinzhou", "474397"),
    ("Camellya", "Forking Paths Among the Stars", "Jalan Bercabang di Antara Bintang", "1.4", "Black Shores", "484900"),
    ("Carlotta", "If On a Rainy Night a Family", "Jika di Suatu Malam Berhujan, Sebuah Keluarga", "2.0", "Ragunna", "492522"),
    ("Roccia", "Starry is the Night", "Berbintanglah Malam Ini", "2.0", "The Strand, Rinascita", "495033"),
    ("Brant", "Sail Day, Captain!", "Hari Berlayar, Kapten!", "2.1", "Fool's Elysium, Rinascita", "503778"),
    ("Cantarella", "A Fleeting Night's Dream", "Mimpi Semalam yang Fana", "2.2", "Porto-Veno Castle", "507221"),
    ("Zani", "A Blaze in the Dark", "Nyala di Kegelapan", "2.3", "Bank Street, Rinascita", "517734"),
]
CONFIRMED_COMP_VERSIONS = {"Changli", "Encore", "Cantarella", "Yinlin", "Lingyang", "Jiyan"}
for who, t_en, t_id, ver, region, src in COMP:
    add("COMP", f"COMPANION · {who.upper()}", t_en, t_id, ver, region, [who, "Rover"],
        f"{who}'s companion story, set in {region}.",
        f"Kisah pendamping {who}, berlatar di {region}.",
        f"A character story that follows {who} away from the main quest. Editors: add a spoiler-light summary of the plot here.",
        f"Kisah karakter yang mengikuti {who} di luar alur utama. Editor: tambahkan ringkasan alur tanpa spoiler berat di sini.",
        src, date="2024-10-24" if who == "Encore" else None, review=who not in CONFIRMED_COMP_VERSIONS)

# ---------------------------------------------------------------- Side and exploration quests (drafts for editors)
DRAFTS = [
    ("EXPL", "Stygian Lacrimosa", "Lacrimosa Stygian", "1.0", "Huanglong", "456861"),
    ("SIDE", "Tales of the Past and Present: Central Plains", "Kisah Masa Lalu dan Kini: Dataran Tengah", "1.0", "Huanglong", "456966"),
    ("EXPL", "Vigil of Endless Night", "Penjagaan Malam Tanpa Akhir", "1.2", "Huanglong", "464361"),
    ("SIDE", "Skyward Voyage", "Pelayaran ke Langit", "2.0", "Rinascita", "492566"),
    ("EXPL", "Should the Shooting Stars Blaze", "Andai Bintang Jatuh Menyala", "2.2", "Rinascita", "507266"),
    ("SIDE", "Urban Legend: The Anonymous Inviter", "Legenda Urban: Pengundang Anonim", "3.0", "Lahai-Roi", "572486"),
    ("EXPL", "Faithful Heart Tested at Skyfall", "Hati Setia Diuji di Skyfall", "3.5", "Mengzhou", "608607"),
    ("EXPL", "Days Without Number", "Hari-Hari Tak Terhitung", "3.7", "Mengzhou", "624625"),
]
for cat, t_en, t_id, ver, region, src in DRAFTS:
    add(cat, "", t_en, t_id, ver, region, [], "", "", "", "", src, review=True, status="draft")


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def body(en, id_):
    """TipTap JSON with one paragraph per language."""
    def doc(text):
        return {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}]} if text else None
    return {"en": doc(en), "id": doc(id_)}


# Shelf order = release date, then authoring order within a version (main before segue before companion).
cat_rank = {"MAIN": 0, "SEGUE": 0, "EVNT": 0, "TALE": 1, "COMP": 2, "SIDE": 3, "EXPL": 3}
ordered = sorted(enumerate(S), key=lambda p: (p[1]["date"], cat_rank[p[1]["cat"]], p[0]))

stories = []
for n, (_, s) in enumerate(ordered, start=1):
    major = s["ver"].split(".")[0]
    stories.append({
        "slug": slugify(s["t_en"]),
        "category": s["cat"],
        "chapter_label": s["label"] or None,
        "title": {"en": s["t_en"], "id": s["t_id"]},
        "original_title": None,
        "original_title_lang": None,
        "romanised_title": None,
        "version": s["ver"],
        "version_group": f"{major}.X",
        "region": s["region"],
        "characters": s["chars"],
        "est_minutes": None,
        "release_date": s["date"],
        "synopsis": {"en": s["syn_en"] or None, "id": s["syn_id"] or None},
        "body": body(s["sum_en"], s["sum_id"]),
        "spine_media": None,
        "cover_media": None,
        "sort_key": n * 100,
        "status": s["status"],
        "publish_at": None,
        "needs_review": s["review"],
        "source_url": s["src"],
    })

seed = {
    "generated": "2026-11-03",
    "notes": "Titles, order, versions, regions and characters from Game8 (see source_url). "
             "Synopses and summaries are original Cranellz text in English (en) and Indonesian (id). "
             "Indonesian titles are fan translations; the game has no official Indonesian localisation. "
             "original_title is left null for editors to fill from the Chinese/Japanese client. "
             "needs_review marks entries whose version or details were inferred and should be checked in-game.",
    "site_settings": {
        "brand_latin": "CRANELLZ",
        "brand_cjk": None,
        "top_right_label": {"en": "ARCHIVE 1.0〜{latest}", "id": "ARSIP 1.0〜{latest}"},
        "back_link_url": None,
        "social_links": [],
        "disclaimer": {
            "en": "Unofficial fan archive. Wuthering Waves and all related names, art and story are © Kuro Games. Cranellz is not affiliated with Kuro Games.",
            "id": "Arsip penggemar tidak resmi. Wuthering Waves beserta nama, karya seni, dan ceritanya © Kuro Games. Cranellz tidak berafiliasi dengan Kuro Games.",
        },
        "default_story_slug": "simulacrum-of-the-heart",
        "default_locale": "en",
        "locales": ["en", "id"],
    },
    "categories": CATEGORIES,
    "version_groups": [
        {"label": "1.X", "sort": 1},
        {"label": "2.X", "sort": 2},
        {"label": "3.X", "sort": 3},
    ],
    "versions": [{"version": v, "name": n, "release_date": d} for v, (n, d) in VERSIONS.items()],
    "stories": stories,
}

with open("seed.json", "w", encoding="utf-8") as f:
    json.dump(seed, f, ensure_ascii=False, indent=2)

pub = [s for s in stories if s["status"] == "published"]
print(f"stories: {len(stories)} (published {len(pub)}, draft {len(stories) - len(pub)})")
print(f"needs_review: {sum(s['needs_review'] for s in stories)}")
print(f"slugs unique: {len({s['slug'] for s in stories}) == len(stories)}")
print("first:", stories[0]["title"]["en"], "| last published:", pub[-1]["title"]["en"])
