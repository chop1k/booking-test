package e2e

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type BookingTestSuite struct {
	suite.Suite

	client *http.Client
}

func (s *BookingTestSuite) SetupSuite() {
	s.client = &http.Client{}
}

func (s *BookingTestSuite) SetupTest() {
	body := []byte("{}")
	req, err := http.NewRequest(http.MethodPost, appURL+"/system/testing/database-reset", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusOK, response.StatusCode)
}

func (s *BookingTestSuite) TestCreatesBooking() {
	now := time.Now().UTC().Truncate(time.Second)

	data := map[string]interface{}{
		"room_id":   123,
		"starts_at": now.Format(time.RFC3339),
		"ends_at":   now.Add(time.Hour).Format(time.RFC3339),
	}

	expected := map[string]interface{}{
		"room_id":    123.0,
		"starts_at":  now.Format(time.RFC3339),
		"ends_at":    now.Add(time.Hour).Format(time.RFC3339),
		"attributes": []interface{}{},
	}

	s.assertBookingCreated(data, expected)

	s.assertBookingAppears(expected)

	s.assertBookingAppears(expected)

	s.assertBookingCannotConflict(now)
}

// assertBookingCreated проверяет успешное создание бронирования
func (s *BookingTestSuite) assertBookingCreated(data map[string]interface{}, expected map[string]interface{}) {
	body, err := json.Marshal(data)
	require.NoError(s.T(), err)

	req, err := http.NewRequest(http.MethodPost, appURL+"/business/bookings", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusOK, response.StatusCode)
	assert.Contains(s.T(), response.Header, "Content-Type")
	assert.Equal(s.T(), "application/json", response.Header.Get("Content-Type"))

	var actual map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&actual)
	require.NoError(s.T(), err)

	delete(actual, "id")

	assert.Equal(s.T(), expected, actual)
}

func (s *BookingTestSuite) assertBookingAppears(expected map[string]interface{}) {
	req, err := http.NewRequest(http.MethodGet, appURL+"/business/bookings", nil)
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusOK, response.StatusCode)
	assert.Contains(s.T(), response.Header, "Content-Type")
	assert.Equal(s.T(), "application/json", response.Header.Get("Content-Type"))

	var actual []map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&actual)
	require.NoError(s.T(), err)
	require.NotEmpty(s.T(), actual)

	delete(actual[0], "id")

	assert.Equal(s.T(), []map[string]interface{}{expected}, actual)
}

func (s *BookingTestSuite) assertBookingCannotConflict(now time.Time) {
	data := map[string]interface{}{
		"room_id":   123,
		"starts_at": now.Add(10 * time.Minute).Format(time.RFC3339),
		"ends_at":   now.Add(10 * time.Minute).Add(time.Hour).Format(time.RFC3339),
	}

	body, err := json.Marshal(data)
	require.NoError(s.T(), err)

	req, err := http.NewRequest(http.MethodPost, appURL+"/business/bookings", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusBadRequest, response.StatusCode)
}

func (s *BookingTestSuite) TestReturnsBadRequest() {
	data := map[string]interface{}{
		"room_id":   123,
		"starts_at": "123",
		"ends_at":   time.Now().Add(time.Hour).Format(time.RFC3339),
	}

	body, err := json.Marshal(data)
	require.NoError(s.T(), err)

	req, err := http.NewRequest(http.MethodPost, appURL+"/business/bookings", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusBadRequest, response.StatusCode)
	assert.Contains(s.T(), response.Header, "Content-Type")
	assert.Equal(s.T(), "application/json", response.Header.Get("Content-Type"))
}

func (s *BookingTestSuite) TestReturnsUnauthorized() {
	req, err := http.NewRequest(http.MethodGet, appURL+"/business/bookings", nil)
	require.NoError(s.T(), err)
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusUnauthorized, response.StatusCode)
}

func (s *BookingTestSuite) TestReturnsMethodNotAllowed() {
	body := []byte("{}")
	req, err := http.NewRequest(http.MethodPut, appURL+"/business/bookings", bytes.NewReader(body))
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	response, err := s.client.Do(req)
	require.NoError(s.T(), err)

	assert.Equal(s.T(), http.StatusMethodNotAllowed, response.StatusCode)
}

func TestBookingTestSuite(t *testing.T) {
	suite.Run(t, new(BookingTestSuite))
}
