CHEFMOJI_SRC_DIR=user-login

install:
	cd $(CHEFMOJI_SRC_DIR) && npm install && npm run build
	cp $(CHEFMOJI_SRC_DIR)/public/build/* public/

build:
	cd $(CHEFMOJI_SRC_DIR) && npm run build
	cp $(CHEFMOJI_SRC_DIR)/public/build/* public/

dev:
	cd $(CHEFMOJI_SRC_DIR) && npm run dev
