# Website Crawler

A Node.js cli application which crawl through websites in search of keywords and locations

## Requirements

This application can be executed as a normal Node application or build and deployed to a `Docker` container.

For more information on installing NPM and Node.js on the local environment, please visit https://nodejs.org/en/download/

For installation instructions on Docker, please visit https://docs.docker.com/get-docker/

MySQL is required for storing the locations list used by the application. For information on installing MySQL, please visit https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/

## Setup

Sample keywords and locations datasets can be found in `sample_data` directory, or you can use your own datasets.

> NOTE: When creating your own locations data table, make sure to have location names under `name` column.

All the environment variables related to database connections and keyword file path can be set as `.env` file in the project root directory. You can use the `env-example` as a reference.

> NOTE: When setting the keywords file path, make sure the set it relative to the project root directoryl

## Build as a Docker container

To build the application as a docker image, run the following command.

```
docker build . -t website-crawler
```

To start the container, run the following command.
```
docker run -v $PWD/src/output:/usr/src/app/src/output -v $PWD/src/logs:/usr/src/app/logs -it website-crawler bash
```

Within the container, run the following command to check the database connection status.
```
checkConnections
```

To find websites with matching keywords and locations, run the following command within the container.
```
crawlForMatchingWebsites [url,[url]]
```

Example:
```
crawlForMatchingWebsites https://www.srilanka.travel/,http://tourismmin.gov.lk/web/index.php/en/
```

To exit from the running container, use the exit command.

## Run application as a Node application
To check database connections, run the following command in the project root directory.
```
node src/index.js --check
```

To run the crawler with website urls, use the following command
```
node src/index.js --crawl -u [url,[url]]
```

Example:
```
node src/index.js --crawl -u https://www.srilanka.travel/,http://tourismmin.gov.lk/web/index.php/en/
```

Application output file can be found in the following path.
```
<root-directory>/src/output/output.txt
```