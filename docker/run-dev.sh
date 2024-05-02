export API_PORT=8585
bash /home/app/build/docker/env.sh
sleep 2
yarn install
yarn dev