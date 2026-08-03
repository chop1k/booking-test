package e2e

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type RoomsTestSuite struct {
	suite.Suite

	client *http.Client
}

func (s *RoomsTestSuite) SetupSuite() {
	s.client = &http.Client{}
}

func (s *RoomsTestSuite) TearDownSuite() {
}

func (s *RoomsTestSuite) SetupTest() {
	body := []byte("{}")
	req, err := http.NewRequest(http.MethodPost, appURL+"/system/testing/database-reset", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusOK, response.StatusCode)
}

func (s *RoomsTestSuite) TestReturnsRooms() {
	expected := []map[string]interface{}{
		{
			"id":          1.0,
			"name":        "Коворкинг",
			"description": "",
			"attachments": []interface{}{
				"/images/rooms/coworking.jpg",
			},
			"attributes": []interface{}{
				map[string]interface{}{
					"type":     "seats",
					"count":    3.0,
					"capacity": 5.0,
				},
				map[string]interface{}{
					"type":  "boards",
					"count": 1.0,
				},
				map[string]interface{}{
					"type":  "air-conditioners",
					"count": 1.0,
				},
			},
		},
		{
			"id":          2.0,
			"name":        "Большая переговорная",
			"description": "Большая комната в ",
			"attachments": []interface{}{
				"/images/rooms/big.jpg",
			},
			"attributes": []interface{}{
				map[string]interface{}{
					"type":     "seats",
					"count":    10.0,
					"capacity": 10.0,
				},
				map[string]interface{}{
					"type":  "displays",
					"count": 1.0,
				},
				map[string]interface{}{
					"type":  "tables",
					"count": 1.0,
				},
				map[string]interface{}{
					"type":  "air-conditioners",
					"count": 1.0,
				},
			},
		},
		{
			"id":          3.0,
			"name":        "Малая переговорная",
			"description": "Малая комната в ",
			"attachments": []interface{}{
				"/images/rooms/small.jpg",
			},
			"attributes": []interface{}{
				map[string]interface{}{
					"type":     "seats",
					"count":    9.0,
					"capacity": 9.0,
				},
				map[string]interface{}{
					"type":  "tables",
					"count": 1.0,
				},
				map[string]interface{}{
					"type":  "air-conditioners",
					"count": 1.0,
				},
			},
		},
	}

	req, err := http.NewRequest(http.MethodGet, appURL+"/business/rooms", nil)
	require.NoError(s.T(), err)
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusOK, response.StatusCode)

	assert.Contains(s.T(), response.Header, "Content-Type")
	assert.Equal(s.T(), "application/json", response.Header.Get("Content-Type"))

	var actual []map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&actual)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), expected, actual)
}

func (s *RoomsTestSuite) TestReturnsUnauthorized() {
	req, err := http.NewRequest(http.MethodGet, appURL+"/business/rooms", nil)
	require.NoError(s.T(), err)
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusUnauthorized, response.StatusCode)
}

func (s *RoomsTestSuite) TestReturnsMethodNotAllowed() {
	body := []byte("{}")
	req, err := http.NewRequest(http.MethodPut, appURL+"/business/rooms", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusMethodNotAllowed, response.StatusCode)
}

func TestRoomsTestSuite(t *testing.T) {
	suite.Run(t, new(RoomsTestSuite))
}
