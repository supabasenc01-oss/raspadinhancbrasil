UPDATE scratch_cards 
SET image_url = 'scratch-cards/3bcce1ac-aa9d-4d46-a39f-0ba8439df938.png' 
WHERE image_url LIKE 'https://images.unsplash.com%';

UPDATE scratch_card_prizes 
SET image_url = 'prizes/3bcce1ac-aa9d-4d46-a39f-0ba8439df938.png'
WHERE image_url IS NULL OR image_url = '';

UPDATE banners
SET image_url = 'banners/3bcce1ac-aa9d-4d46-a39f-0ba8439df938.png'
WHERE image_url LIKE 'https://images.unsplash.com%';