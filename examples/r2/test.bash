attempt_counter=0
max_attempts=10

# start the server and cancel it later
pnpm dev --port 3000 > /dev/null &

until $(output=$(curl --output /dev/null --silent -X PUT http://localhost:3000/test -d "Hello, world")); do
    if [ ${attempt_counter} -eq ${max_attempts} ];then
      echo "Max attempts reached"
      kill %1
      exit 1
    fi

    attempt_counter=$(($attempt_counter+1))
    sleep 1
done

output=$(curl --silent -X PUT http://localhost:3000/test -d "Hello, world")
if [ "$output" != "Put test successfully!" ]; then
  echo "Put failed!"
  kill %1
  exit 1
fi

output=$(curl --silent -X GET http://localhost:3000/test)
if [ "$output" != "Hello, world" ]; then
  echo "Get failed!"
  kill %1
  exit 1
fi

output=$(curl --silent -X DELETE http://localhost:3000/test)
if [ "$output" != "Deleted!" ]; then
  echo "Delete failed!"
  kill %1
  exit 1
fi

output=$(curl --silent -X GET http://localhost:3000/test)
if [ "$output" != "Object Not Found" ]; then
  echo "Delete failed!"
  kill %1
  exit 1
fi

kill %1
