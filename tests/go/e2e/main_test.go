package e2e

import (
	"flag"
	"log"
	"os"
	"testing"
)

var appURL string

func TestMain(m *testing.M) {
	urlFlag := flag.String("app-url", "", "Base URL of the application for E2E tests")
	flag.Parse()

	if *urlFlag != "" {
		appURL = *urlFlag
		log.Printf("Using app URL from flag: %s", appURL)
	} else if envURL := os.Getenv("APP_URL"); envURL != "" {
		appURL = envURL
		log.Printf("Using app URL from environment variable: %s", appURL)
	} else {
		log.Fatalln("APP_URL should be defined")
	}

	exitCode := m.Run()

	os.Exit(exitCode)
}
